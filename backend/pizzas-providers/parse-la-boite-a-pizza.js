const { DefaultParser } = require('./default-parser');
const denodeify = require('denodeify');
const request = denodeify(require('request'));
const url = 'https://www.laboiteapizza.com/commande/respT/1381';
const name = 'LaBoiteAPizza';

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
  }

  /**
   * The http request to execute before the pizzas fetch.
   */
  beforeRequest() {
    let cookie = '';
    return new Promise(function (resolve, reject) {
      // We need to fetch the cookie
      request( { url: url1})
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
            url: url2,
            jar: true,
            headers: {
              'Cookie': cookie,
            }
          });
        }
      )
      .then( (response, body) => {
          console.log('Fetching page 2');
          if (response.body.indexOf('Toulouse Dupuy') !== -1) {
            console.log('youpi !!');
          }
          else {
            console.log('youpi !!');
          }

          // console.log(response.body);
          /*
          :authority:www.laboiteapizza.com
          :method:GET
          :path:/commande/respT/1381
          :scheme:https
          accept:*
          accept-encoding:gzip, deflate, sdch, br
          accept-language:fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4
            cookie:PHPSESSID=e5ec4i7ti2vfp5mc2osrmunah5; _ga=GA1.2.1316901557.1511300248; _gid=GA1.2.644148628.1511300248
              referer:https://www.laboiteapizza.com/commande/shop/category/7357
              user-agent:Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/53.0.2785.143 Chrome/53.0.2785.143 Safari/537.36
              x-requested-with:XMLHttpRequest

              */
          // if (error) reject('Network problems, check your internet settings: ' + error);

          // if (response.headers['set-cookie'] === undefined) {
          //   console.log('Cannot get a cookie!');
          //   reject();
          // }
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
