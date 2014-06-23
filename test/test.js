/* global before:false, describe:false, it:false */
'use strict';

var
  assert = require('assert'),
  Promise = require('es6-promise').Promise,
  rdf = require('rdf-interfaces'),
  rdfTestUtils = require('rdf-test-utils')(rdf);

require('rdf-ext')(rdf);
require('../rdf-jsonify')(rdf);


describe('rdf-jsonify', function () {
  var
    store,
    jsonify,
    cachedJsonify,
    person = {},
    blog = {};

  var initPerson = function () {
    person.iri = 'http://localhost/person/john';

    person.context = { '@vocab': 'http://schema.org/' };

    person.json = {
      'familyName': 'Doe',
      'givenName': 'John'
    };

    person.jsonLd = {
      '@context': person.context,
      '@id': person.iri,
      'familyName': 'Doe',
      'givenName': 'John'
    };

    person.preGraph = rdf.createGraph();
    person.preGraph.add(rdf.createTriple(
      rdf.createNamedNode(person.iri),
      rdf.createNamedNode('http://schema.org/additionalName'),
      rdf.createLiteral('Richard')
    ));

    person.graph = rdf.createGraph();
    person.graph.add(rdf.createTriple(
      rdf.createNamedNode(person.iri),
      rdf.createNamedNode('http://schema.org/familyName'),
      rdf.createLiteral('Doe')
    ));
    person.graph.add(rdf.createTriple(
      rdf.createNamedNode(person.iri),
      rdf.createNamedNode('http://schema.org/givenName'),
      rdf.createLiteral('John')
    ));

    person.mergedGraph = rdf.createGraph();
    person.mergedGraph.addAll(person.preGraph);
    person.mergedGraph.addAll(person.graph);

    jsonify.addContext('http://localhost/person/', person.context);
  };

  var initBlog = function () {
    blog.iri = 'http://localhost/blog';

    blog.context = { '@vocab': 'http://schema.org/' };

    blog.jsonLdPost = {
      '@id': blog.iri + '#post',
      'headline': 'Headline',
      'articleBody': 'Body'
    };

    blog.jsonLdComment = {
      '@id': blog.iri + '#comment',
      'commentText': 'Comment'
    };

    blog.jsonLdPostCommentLink = {
      '@id': blog.jsonLdPost['@id'],
      'comment': { '@id': blog.jsonLdComment['@id'] }
    };

    blog.graph = rdf.createGraph();

    // jsonLdPost
    blog.graph.add(rdf.createTriple(
      rdf.createNamedNode(blog.jsonLdPost['@id']),
      rdf.createNamedNode('http://schema.org/headline'),
      rdf.createLiteral('Headline')
    ));
    blog.graph.add(rdf.createTriple(
      rdf.createNamedNode(blog.jsonLdPost['@id']),
      rdf.createNamedNode('http://schema.org/articleBody'),
      rdf.createLiteral('Body')
    ));

    // jsonLdComment
    blog.graph.add(rdf.createTriple(
      rdf.createNamedNode(blog.jsonLdComment['@id']),
      rdf.createNamedNode('http://schema.org/commentText'),
      rdf.createLiteral('Comment')
    ));

    // jsonLdPostCommentLink
    blog.graph.add(rdf.createTriple(
      rdf.createNamedNode(blog.jsonLdPostCommentLink['@id']),
      rdf.createNamedNode('http://schema.org/comment'),
      rdf.createNamedNode(blog.jsonLdPostCommentLink.comment['@id'])
    ));

    jsonify.addContext(new RegExp('.*localhost\/blog.*'), blog.context);
  };

  before(function (done) {
    store = new rdf.promise.Store(new rdf.InMemoryStore());
    jsonify = new rdf.JSONify(store);
    cachedJsonify = new rdf.CachedJSONify(jsonify);

    initPerson();
    initBlog();

    done();
  });

  describe('JSONify using iri and context arguments', function () {
    it('should fetch graph via get', function (done) {
      // fill with initial data
      store.add(person.iri, person.graph)
        // fetch object via IRI and compact with given JSON-LD context
        .then(function () { return jsonify.get(person.iri, person.context); })
        // compare JSON-LD objects
        .then(function (actual) { assert.deepEqual(actual, person.jsonLd); })
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });

    it('should add graph via put', function (done) {
      store.add(person.iri, person.preGraph) // fill with initial data
        .then(function () { return jsonify.put(person.iri, person.jsonLd); }) // put object
        .then(function () { return store.graph(person.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEqual(actual, person.graph); }) // compare graphs
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });

    it('should merge graph via patch', function (done) {
      store.add(person.iri, person.preGraph) // fill with initial data
        .then(function () { return jsonify.patch(person.iri, person.jsonLd); }) // patch object
        .then(function () { return store.graph(person.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEqual(actual, person.mergedGraph); }) // compare grapha
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });

    it('should delete graph via delete', function (done) {
      store.add(person.iri, person.graph) // fill with initial data
        .then(function () { return jsonify.delete(person.iri); }) // delete object/graph
        .then(function () { return store.graph(person.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEmpty(actual); }) // check graph is empty
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });
  });

  describe('JSONify using iri argument and context via routing', function () {
    it('should fetch graph via get', function (done) {
      store.add(person.iri, person.graph) // fill with initial data
        .then(function () { return jsonify.get(person.iri); }) // fetch object
        .then(function (actual) { assert.deepEqual(actual, person.jsonLd); }) // compare objects
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });

    it('should add graph via put', function (done) {
      store.add(person.iri, person.preGraph) // fill with initial data
        .then(function () { return jsonify.put(person.iri, person.json); }) // put object
        .then(function () { return store.graph(person.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEqual(actual, person.graph); }) // compare graphs
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });

    it('should merge graph via patch', function (done) {
      store.add(person.iri, person.preGraph) // fill with initial data
        .then(function () { return jsonify.patch(person.iri, person.json); }) // patch object
        .then(function () { return store.graph(person.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEqual(actual, person.mergedGraph); }) // compare graphs
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });
  });

  describe('JSONify using JSON-LD @id and context via routing', function () {
    it('should add graph via put', function (done) {
      store.add(person.iri, person.preGraph) // fill with initial data
        .then(function () { return jsonify.put(person.jsonLd); }) // put object
        .then(function () { return store.graph(person.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEqual(actual, person.graph); }) // compare graphs
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });

    it('should merge graph via patch', function (done) {
      store.add(person.iri, person.preGraph) // fill with initial data
        .then(function () { return jsonify.patch(person.jsonLd); }) // patch object
        .then(function () { return store.graph(person.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEqual(actual, person.mergedGraph); }) // compare graphs
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });

    it('should delete graph via delete', function (done) {
      store.add(person.iri, person.graph) // fill with initial data
        .then(function () { return jsonify.delete(person.jsonLd); }) // delete object/graph
        .then(function () { return store.graph(person.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEmpty(actual); }) // check graph is empty
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });
  });

  describe('JSONify using multiple JSON-LD objects with @id and context via routing', function () {
    it('should add graph via put', function (done) {
      store.delete(blog.iri) // cleanup graph
        .then(function () { return jsonify.put(blog.jsonLdPost, blog.jsonLdComment, blog.jsonLdPostCommentLink); }) // put objects
        .then(function () { return store.graph(blog.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEqual(actual, blog.graph); }) // compare graphs
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });

    it('should merge graph via patch', function (done) {
      store.delete(blog.iri) // cleanup graph
        .then(function () { return jsonify.put(blog.jsonLdPost); }) // put object
        .then(function () { return jsonify.patch(blog.jsonLdComment, blog.jsonLdPostCommentLink); }) // patch with other objects
        .then(function () { return store.graph(blog.iri); }) // fetch graph
        .then(function (actual) { return rdfTestUtils.p.assertGraphEqual(actual, blog.graph); }) // compare graphs
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });
  });

  describe('CachedJSONify without context routing', function () {
    it('should fetch graph via get', function (done) {
      // fill with initial data
      store.add(person.iri, person.graph)
        // call async test wrapped in Promise
        .then(function () {
          return new Promise(function (resolve, reject) {
            // call get with uncached iri
            var syncPerson = cachedJsonify.get(person.iri, person.context, function (asyncPerson) {
              // uncached -> callback should be called
              try {
                assert.deepEqual(asyncPerson, person.jsonLd, 'uncached IRI should return object asnych');
              } catch (error) {
                reject(error);
              }

              resolve();
            });

            // uncached -> return value should be null
            assert.equal(syncPerson, null, 'uncached IRI should return defaultValue/IRI');
          });
        })
        .then(function () { done(); })
        .catch(function (error) { done('' + error); });
    });
  });
});