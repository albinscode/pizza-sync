const { DefaultParser } = require('./default-parser');
const denodeify = require('denodeify');
const request = denodeify(require('request'));
const url = 'https://www.laboiteapizza.com/commande/respT/1040';
const name = 'LaBoiteAPizza';

const cheerio = require('cheerio');

const conf = require('../conf.json');

const urlTemplate = 'https://www.laboiteapizza.com/commande/shop';
const url3 = 'https://www.laboiteapizza.com/commande/respT/1040';

/**
 * La boite à pizza allows to manage several shops.
 * You have to choose your shop, e.g. in Toulouse : `Toulouse Dupuy`
 * Then several urls have to be provided:
 * * the shop url: https://www.laboiteapizza.com/commande/shop/load?id=49
 * * the category url: https://www.laboiteapizza.com/commande/shop/category/7357
 * * https://www.laboiteapizza.com/commande/respT/1040
 */
class LaBoiteAPizza extends DefaultParser {

  constructor() {
    super(name, url);
    this._previousBody = '';
  }


  // Executed once before pizzas fetching
  beforeRequest() {
    const url1 = `${urlTemplate}/load?id=${conf.providersPrefs.boite.shop}`;
    const self = this;
    return new Promise( (resolve, reject) => {
      // We need to fetch the cookie and to propagate it along the whole session
      request(
        {
          url: url1,
          jar: true,
        }
      )
      .then( (response) => {
          self._previousBody = response.body;
          resolve();
        }
      );
    });
  }

  beforeEachCategoryRequest(url) {
    return new Promise( (resolve, reject) => {
      // We need to fetch the cookie and to propagate it along the whole session
      request(
        {
          url: url,
          jar: true,
        }
      )
      .then( (response) => {
          resolve();
        }
      );
    });
  }

  getCategories() {
    return new Promise ( (resolve, reject) => {
      // TODO we have to parse the menu to get the list of categories with their name and url
      resolve(
        [
          {
            url: url3,
            categoryUrl: 'https://www.laboiteapizza.com/commande/shop/category/7357',
            categoryName: 'trad'
          },
          {
            url: url3,
            categoryUrl: 'https://www.laboiteapizza.com/commande/shop/category/7557',
            categoryName: 'trad2'
          },
          {
            url: url3,
            categoryUrl: 'https://www.laboiteapizza.com/commande/shop/category/7357',
            categoryName: 'trad3'
          }
        ]
      );
    });
  }

  parsePhone() {
    // the phone will be parsed on the previous body page
    const $2 = cheerio.load(this._previousBody);
    return $2('#contentTitle div span').text();
  }

  parseSectionDom() {
    return this._$('table');
  }

  parsePizzaCategory() {
    return 'hardcoded';
  }

  parsePizzasDom() {
    return this._sectionDom.find('.productBox');
  }

  parsePizzaName() {
    return this._pizzaDom.find('.productName').text();
  }

  parsePizzaIngredients() {
    return this._pizzaDom.find('.productDescription').text();
  }

  parsePrices() {
    return Object.values(this._pizzaDom.find('.productBox input[type="hidden"]'))
      .map( (input) => input && input.attribs ? parseFloat(input.attribs.value) : 0)
      .filter ( (elt) => elt !== 0)
      .splice(0, 3)
      .sort( (a, b) => a - b) ;
  }

  parsePizzaImage() {
   return this._pizzaDom.find('.picture img').attr('src');
  }
}

module.exports = { LaBoiteAPizza };
