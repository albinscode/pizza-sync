const { DefaultParser } = require('./default-parser');
const denodeify = require('denodeify');
const request = denodeify(require('request'));
const url = 'https://www.laboiteapizza.com/commande/respT/1040';
const name = 'LaBoiteAPizza';

const cheerio = require('cheerio');

// TODO urls to be externalized!
const url1 = 'https://www.laboiteapizza.com/commande/shop/load?id=49';
const url2 = 'https://www.laboiteapizza.com/commande/shop/category/7357';

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

  /**
   * The http request to execute before the pizzas fetch.
   */
  beforeRequest() {
    let cookie = '';
    const self = this;
    return new Promise(function (resolve, reject) {
      // We need to fetch the cookie and to propagate it along the whole session
      request(
        {
          url: url1,
          jar: true,
        }
      )
      .then( (response) => {
          return request( {
            url: url2,
            jar: true,
          });
        }
      )
      .then( (response) => {
          self._previousBody = response.body;
          resolve();
        }
      );
    });

  }

  parsePhone() {
    // the phone will be parsed on the previous body page
    // const $2 = cheerio.load(this._previousBody);
    // return $2('#contentTitle');
    return '0561833833';
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
    // TODO, prices are embedded within javascript
    // And list too much linked to pizza de l'ormeau, to be refactorized
    return this._pizzaDom.find('.productPriceCommand');
  }

  parsePizzaImage() {
   return this._pizzaDom.find('.picture img').attr('src');
  }
}

module.exports = { LaBoiteAPizza };
