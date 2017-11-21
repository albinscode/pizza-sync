const request = require('request');
const cheerio = require('cheerio');

const { requestOptions } = require('../helpers/http.helper');
const { getPathImgPizza } = require('../helpers/file.helper');

const { PizzasModel } = require('../models/pizzas.model');
const { PizzasCategoriesModel } = require('../models/pizzas-categories.model');
const { IngredientsModel } = require('../models/ingredients.model');

/**
 * This default parser allows to ease the creation of a new parser.
 */
class DefaultParser {

  constructor(name, url) {

    // the whole cheerio page
    this._$ = null;

    this._pizzeria = {
      name: name,
      phone: '',
      url: url
    };

    // folder that contains the pizzas images
    this._imgsFolder = `${__dirname}/../../frontend/src/assets/img/pizzas-providers/${name}`;
  }

  beforeRequest() {
    return new Promise(function (resolve, reject) {
      return resolve();
    });
  }

  getPizzasAndPizzasCategories() {
    // we get the cooke from before request
    return this.beforeRequest()
    .then( (cookie) => {
      console.log(this._pizzeria.url);
      console.log('on a le cookie %j', cookie );
      return new Promise(resolve => {
      // fetch the website
      request(
        Object.assign({
          url: this._pizzeria.url,
          jar: true,
          headers: {
          ':authority': 'www.laboiteapizza.com',
          ':method': 'GET',
          ':path': '/commande/respT/1381',
          ':scheme': 'https',
            'referer': 'https://www.laboiteapizza.com/commande/shop/category/7357',
            'x-requested-with': 'XMLHttpRequest',
            'Cookie': cookie,
          }
        }, requestOptions),
        (error, response, body) => {
          if (!error && response.statusCode == 200) {
            // build the response object containing the pizzas and pizzas categories
            const res = {
              pizzeria: this._pizzeria,
              pizzas: [],
              pizzasCategories: [],
              ingredients: []
            };

            if (body.indexOf('Hot Fever') !== -1) {
              console.log('COOL !');
            }
            else {
              console.log('pas cool');
            }
            this._$ = cheerio.load(body);

            res.pizzeria.phone = this.parsePhone();

            // we get the categories list
            this._sectionsDom = this.parseSectionDom();
            console.log(this._sectionsDom.length);
            // console.log(this._$.text());

            this._sectionsDom.map(i => {
              console.log('test');
              this._sectionDom = this._$(this._sectionsDom[i]);

              const pizzaCategory = this.parsePizzaCategory();

              const finalPizzaCategory = {
                id: PizzasCategoriesModel.getNewId(),
                name: pizzaCategory,
                pizzasIds: []
              };

              res.pizzasCategories.push(finalPizzaCategory);

              // we browse each pizza
              this._pizzasDom = this.parsePizzasDom();

              this._pizzasDom.map(j => {
                this._pizzaDom = this._$(this._pizzasDom[j]);

                const pizzaName = this.parsePizzaName();
                const pizzaIngredientsTxt = this.parsePizzaIngredients();
                const pizzaPricesDom = this.parsePrices();

                const pizzaIngredientsTxtArray = pizzaIngredientsTxt
                  .replace('.', '')
                  .replace(', ', ',')
                  .trim()
                  .split(',')
                  // some pizzas do not have ingredients as they're already written in their title
                  // for example "Poire Williams / chocolat", "Banane / Chocolat" and "Ananas / Chocolat"
                  // we do not want to have empty ingredients and thus, they should be removed
                  .filter(x => x !== '');

                const pizzaIngredients = pizzaIngredientsTxtArray.map(IngredientsModel.registerIfNewAndGetId);

                const pizzaPrices = [];
                pizzaPricesDom.map(k => {
                  const price = this._$(pizzaPricesDom[k]).children().remove().end().text().replace(',', '.');
                  pizzaPrices.push(parseFloat(price));
                });

                // some cross site ;)
                const pizzaImg = this.parsePizzaImage();

                const finalPizza = {
                  id: PizzasModel.getNewId(),
                  name: pizzaName,
                  imgUrl: pizzaImg,
                  ingredientsIds: pizzaIngredients,
                  prices: pizzaPrices
                };

                finalPizzaCategory.pizzasIds.push(finalPizza.id);
                res.pizzas.push(finalPizza);
              });
            });

            res.ingredients = IngredientsModel.getIngredients();

            resolve(res);
          }
        });
    });
    });
  }

  // interfaces methods to be implemented
  parsePhone() { }

  parseSectionDom() { }

  parsePizzaCategory() { }

  parsePizzasDom() { }

  parsePizzaName() { }

  parsePizzaIngredients() { }

  parsePrices() { }

  parsePizzaImage() { }
}

module.exports = { DefaultParser };
