let should = require('should');
require('mocha');
const { LaBoiteAPizza } = require('../pizzas-providers/parse-la-boite-a-pizza.js');

describe('>>>> La boite à pizza parsing', function() {
    this.timeout(10000);
    it('Global run', function(done) {
      var tutti = new LaBoiteAPizza();
      tutti
        .getPizzasAndPizzasCategories()
        .then(function (result) {
          result.pizzeria.name.should.ok();
          result.pizzeria.url.should.ok();
          result.pizzeria.phone.should.equal('0561833833');
          result.pizzas.length.should.equal(36);
          result.pizzasCategories.length.should.equal(3);
          console.log(result.pizzasCategories);
          result.pizzasCategories[0].name.should.equal('trad');
          result.pizzasCategories[1].name.should.equal('trad2');
          result.pizzasCategories[2].name.should.equal('trad3');
          done();
      }).catch( e =>  done(e));
    });
});
