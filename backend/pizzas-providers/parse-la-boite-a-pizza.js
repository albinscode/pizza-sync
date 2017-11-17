const { DefaultParser } = require('./default-parser');
const denodeify = require('denodeify');
const request = denodeify(require('request'));
const url = 'https://www.laboiteapizza.com/card/category/7357';
const name = 'LaBoiteAPizza';

/**
 * La boite à pizza allows to manage several shops.
 * You have to choose your shop, e.g. in Toulouse : `Toulouse Dupuy`
 * Then 2 urls have to be provided:
 * * https://www.laboiteapizza.com/restaurant/Toulouse_-_Dupuy
 * * the shop url: https://www.laboiteapizza.com/commande/shop/load?id=49
 * * the pizza url: https://www.laboiteapizza.com/commande/shop/category/7357
 */
class LaBoiteAPizza extends DefaultParser {

  constructor() {
    super(name, url);
  }

  /**
   * The http request to execute before the pizzas fetch.
   */
  beforeRequest() {
    let cookie = '';
    return new Promise(function (resolve, reject) {
      // We need to fetch the cookie
      request( { url: 'https://www.laboiteapizza.com/restaurant/Toulouse_-_Dupuy' })
      .then( (response, body) => {
          console.log('Fetching page');
          // console.log(error);
          // if (error) reject('Network problems, check your internet settings: ' + error);

          // if (response.headers['set-cookie'] === undefined) {
          //   console.log('Cannot get a cookie!');
          //   reject();
          // }
          let cookieLemonLdapServer = response.headers['set-cookie'][0];
          cookie = cookieLemonLdapServer.split(';')[0];
          console.log('cookie' + cookie);

          return request( {
            url: 'https://www.laboiteapizza.com/commande/shop/load?id=49',
            jar: true,
            headers: {
              'Cookie': cookie,
            }
          });
        }
      )
      .then( (response, body) => {
          console.log('Fetching page 2');
          console.log(request);

          // if (error) reject('Network problems, check your internet settings: ' + error);

          // if (response.headers['set-cookie'] === undefined) {
          //   console.log('Cannot get a cookie!');
          //   reject();
          // }
          console.log(response.headers);
          // var cookieLemonLdap = cookieLemonLdapServer.split(';')[0];
          console.log(cookie);
          resolve(cookie);
        }
      );
    });

  }

  parsePhone() {
    return this._$('#deliveryText div').first().text().trim().substring(0, 12);
  }

  parseSectionDom() {
    return this._$('table');
  }

  parsePizzaCategory() {
    return 'hardcoded';
  }

  parsePizzasDom() {
    return this._sectionDom.find(this._$('.boxContent'));
  }

  parsePizzaName() {
    return this._pizzaDom.find(this._$('.item-name')).text();
  }

  parsePizzaIngredients() {
    return this._pizzaDom.find(this._$('.item-ingredients')).text();
  }

  parsePrices() {
    return this._pizzaDom.find(this._$('.item-price'));
  }

  parsePizzaImage() {
   return this._pizzaDom.find('.item-img img').attr('src');
  }
}

module.exports = { LaBoiteAPizza };
