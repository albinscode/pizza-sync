let should = require('should');
require('mocha');
const { LaBoiteAPizza } = require('../pizzas-providers/parse-la-boite-a-pizza.js');

describe('>>>> La boite à pizza parsing', function() {
    this.timeout(5000);
    it('Global run', function(done) {
      var tutti = new LaBoiteAPizza();
      tutti
        .getPizzasAndPizzasCategories()
        .then(function (result) {
          result.pizzeria.name.should.ok();
          result.pizzeria.url.should.ok();
          result.pizzeria.phone.should.equal('0825 800 333');
          result.pizzas.length.should.be.above(30);
          done();
      }).catch( e =>  done(e));
    });
});
