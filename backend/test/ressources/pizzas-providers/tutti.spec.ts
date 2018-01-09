import { TuttiProvider} from '../../../src/features/pizzas-providers/implementations/tutti.class';

describe('>>>> Tutti parsing', function() {
    it('Global run', function(done) {
      let tutti = new TuttiProvider();
      tutti
        .fetchAndParseData()
        .then(function (result) {
          expect(result.pizzeria.name).toEqual('Tutti Pizza');
          expect(result.pizzeria.url).toBeTruthy();

          // phone is not available
          expect(result.pizzeria.phone).toBeFalsy();

          expect(result.pizzeria.pizzasCategories.length).toEqual(4);
          expect(result.pizzeria.pizzasCategories[0].pizzas.length).toEqual(12);

          const firstPizza = result.pizzeria.pizzasCategories[0].pizzas[0];
          expect(firstPizza.prices.length).toEqual(2);
          expect(firstPizza.prices[0]).toEqual(7.5);
          expect(firstPizza.prices[1]).toEqual(11.5);

          done();
      }).catch( e =>  done(e));
    });
});
