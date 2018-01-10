import { Component } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { PizzasProvider } from '../pizzas-provider.class';

const urlTemplate = 'https://www.laboiteapizza.com/commande/shop';

// TODO update old tutti with boite a pizza

/**
 * La boite à pizza allows to manage several shops.
 * You have to choose your shop, e.g. in Toulouse : `Toulouse Dupuy`
 * Then several urls have to be provided:
 * * the shop url (in conf): https://www.laboiteapizza.com/commande/shop/load?id=49
 * * the category url that will give you pizzas urls: https://www.laboiteapizza.com/commande/shop/category/7357
 * * https://www.laboiteapizza.com/commande/respT/1040
 *
 */
export class BoiteProvider extends PizzasProvider {
  readonly longCompanyName = `LaBoiteAPizza`;
  readonly shortCompanyName = `Boite`;

  protected phone = '';
  protected url = 'https://www.laboiteapizza.com/commande/respT/1040';
  protected urlsPizzasPages = [
    'https://www.tutti-pizza.com/fr/boutique/pizzas.php',
  ];

  getPhone(): string {
    return this.phone;
  }

  getPizzasCategoriesWrapper($: CheerioStatic): Cheerio {
    return $('#listProduct .row');
  }

  getPizzaCategoryName(pizzaCategoryWrapper: Cheerio): string {
    return pizzaCategoryWrapper.prev().text();
  }

  getPizzasWrappers(pizzaCategoryWrapper: Cheerio): Cheerio {
    return pizzaCategoryWrapper.find('.item');
  }

  getPizzaName(pizzaWrapper: Cheerio): string {
    return pizzaWrapper.find('.item-name').text();
  }

  getPizzaIngredients(pizzaWrapper: Cheerio): string[] {
    const pizzaIngredientsText = pizzaWrapper.find('.item-ingredients').text();

    return pizzaIngredientsText.split(',');
  }

  getPrices(pizzaWrapper: Cheerio, $: CheerioStatic): number[] {
    const pizzaPricesDom = pizzaWrapper
      .find('.item-price')
      // tutti sometimes add "promotion" in `.item-price` and 2 prices
      // are displayed here except that one is striked through
      // so we just keep the one which is not into the `del` component
      .children('del')
      .remove()
      .end();

    return pizzaPricesDom.toArray().map(pizzaPriceDom => {
      const [price] = $(pizzaPriceDom)
        .text()
        .replace(',', '.')
        .split(' ');

      return +price;
    });
  }

  getPizzaImage(
    pizzaWrapper: Cheerio
  ): { localFolderName: string } | { distantUrl: string } {
    const distantUrl = pizzaWrapper.find('.item-img img').attr('src');

    return { distantUrl };
  }
}
