const request = require('request');
const cheerio = require('cheerio');

const { requestOptions } = require('../helpers/http.helper');
const { getPathImgPizza } = require('../helpers/file.helper');

const { PizzasModel } = require('../models/pizzas.model');
const { PizzasCategoriesModel } = require('../models/pizzas-categories.model');
const { IngredientsModel } = require('../models/ingredients.model');

const DEBUG = true;

if (DEBUG) {
  require('request-debug')(request);
}

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

  beforeEachCategoryRequest() {
    return new Promise(function (resolve, reject) {
      return resolve();
    });
  }

  getPizzasAndPizzasCategories() {
    // we get the cookie from before request
    return this.beforeRequest()
      // we get categories urls if not on same page
      .then( () => this.getCategories())
      .then( (urls) => this.fetchPizzas(urls));
  }

  fetchPizzas(urls) {
    // we execute promises sequentially
    return urls.reduce(
      (p, url) => p.then(
        () => this.beforeEachCategoryRequest(url)
          .then( () => this.fetchPizza(url))
      ),
      Promise.resolve()
    );
  }

  fetchPizza(url) {
      return new Promise(resolve => {
      // fetch the website
      request(
        {
          // We have several urls?
          url: url,
          jar: true,
        },
        (error, response, body) => {
          if (!error && response.statusCode == 200) {
            // build the response object containing the pizzas and pizzas categories
            const res = {
              pizzeria: this._pizzeria,
              pizzas: [],
              pizzasCategories: [],
              ingredients: []
            };

            this._$ = cheerio.load(body);

            res.pizzeria.phone = this.parsePhone();

            // we get the categories list
            this._sectionsDom = this.parseSectionDom();

            if (DEBUG) {
              console.log('There will be %j category(ies)', this._sectionsDom.length);
            }

            this._sectionsDom.map(i => {
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

                const pizzaPrices = this.parsePrices();

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
                if (DEBUG) {
                  console.log('We grabbed a new pizza! %j', finalPizza);
                }
              });
            });

            res.ingredients = IngredientsModel.getIngredients();

            resolve(res);
          }
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

  /*
   * @return an array of categories if any on the current page
   */
  getCategories() {
    return new Promise();
  }
}

module.exports = { DefaultParser };
