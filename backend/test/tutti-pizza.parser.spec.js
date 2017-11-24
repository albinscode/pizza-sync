let should = require('should');
require('mocha');
const { TuttiPizza } = require('../pizzas-providers/parse-tutti-pizza.js');

describe('>>>> Tutti parsing', function() {
    this.timeout(5000);
    it('Global run', function(done) {
      var tutti = new TuttiPizza();
      tutti
        .getPizzasAndPizzasCategories()
        .then(function (result) {
          result.pizzeria.name.should.ok();
          result.pizzeria.url.should.ok();
          result.pizzeria.phone.should.equal('');
          result.pizzas.length.should.be.above(30);

          const firstPizza = result.pizzas[0];
          firstPizza.prices.length.should.be.equal(2);
          firstPizza.prices[0].should.be.equal(7.5);
          firstPizza.prices[1].should.be.equal(11.5);

          done();
      }).catch( e =>  done(e));
    });
});
