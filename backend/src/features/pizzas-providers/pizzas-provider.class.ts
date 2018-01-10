import * as cheerio from 'cheerio';

import {
  IPizzeriaNestedCommonWithoutId,
  IPizzeriaNestedFkWithoutId,
  IPizzaCategoryFkWithoutId,
  IPizzaFkWithoutId,
} from './pizzas-providers.interface';
import { requestOptions } from '../../helpers/http.helper';
import { getPathImgPizza } from '../../helpers/file.helper';

const DEBUG = false;

let get = require('request');

if (DEBUG) {
  require('request-debug')(get);
}

export abstract class BasicPizzasProvider {
  //  used to write in console autocomplete
  abstract shortCompanyName: string;

  //  used to display in lists
  abstract longCompanyName: string;

  protected abstract phone: string;

  // the URL of the website in case a user wants to visit it
  protected abstract url: string;

  abstract async fetchAndParseData(): Promise<{
    pizzeria: IPizzeriaNestedFkWithoutId;
  }>;

  getPizzeriaInformation(): IPizzeriaNestedCommonWithoutId {
    return {
      name: this.longCompanyName,
      phone: this.phone,
      url: this.url,
    };
  }
}

export abstract class PizzaProviderMock extends BasicPizzasProvider {
  private pizzeriaMock: IPizzeriaNestedFkWithoutId;
  // no need for mocks to define this properties
  // as it'll be found from the mock object
  longCompanyName = '';
  phone = '';
  url = '';

  constructor(pizzeriaMock: IPizzeriaNestedFkWithoutId) {
    super();
    this.pizzeriaMock = pizzeriaMock;
    this.longCompanyName = this.pizzeriaMock.name;
    this.phone = this.pizzeriaMock.phone;
    this.url = this.pizzeriaMock.url;
  }

  async fetchAndParseData() {
    return await Promise.resolve({ pizzeria: this.pizzeriaMock });
  }
}

export abstract class PizzasProvider extends BasicPizzasProvider {
  private imgsBaseFolder = `${
    __dirname
  }/../../../../frontend/src/assets/img/pizzas-providers`;

  // the page where to find categories if any
  // otherwise the pizza page will be used
  protected abstract categoryUrl: string = null;

  protected abstract categories: string[] = [];

  // the URLs of the differents pages to parse the pizzas
  // most pizzas website only have one but some of them have many
  protected abstract urlsPizzasPages: string[];

  async fetchAndParseData(): Promise<{
    pizzeria: IPizzeriaNestedFkWithoutId;
  }> {
    const pages = await this.fetchPages();

    const pizzasCategories = this.parsePagesAndMergePizzasCategories(pages);

    if (DEBUG) {
      console.log('There will be %j category(ies)', pizzasCategories.length);
    }

    // FIXME what if categories cannot be parsed on pizza page side
    // but on a dedicated page?

    return {
      pizzeria: {
        ...this.getPizzeriaInformation(),
        pizzasCategories,
      },
    };
  }

  private parsePagesAndMergePizzasCategories(
    pages: CheerioStatic[]
  ): IPizzaCategoryFkWithoutId[] {
    // FIXME to use the pop...
    this.categories = this.categories.reverse();
    return pages.reduce(
      (acc, page) => {
        const { pizzasCategories } = this.parsePage(page, this.categories.pop());

        return [...acc, ...pizzasCategories];
      },
      [] as IPizzaCategoryFkWithoutId[]
    );
  }

  private fetchCategoriesPage(): Promise<{categoryName: string, categoryUrl: string} []> {

    if (this.categoryUrl) {
      return new Promise((resolve, reject) => {
        resolve([]);
      });
    }
    else {
      return new Promise((resolve, reject) => {
        resolve([]);
      });
    }
  }

  private fetchPages(): Promise<CheerioStatic[]> {
    // TODO we have to specify urls grabbed from categories
    const categoriesPromise = this.fetchCategoriesPage().then ( (categories: {categoryName: string, categoryUrl: string}[]) => {
      if (categories.length > 0) {
        this.urlsPizzasPages = categories.map(elem => elem.categoryUrl);
        this.categories = categories.map(elem => elem.categoryUrl);
      }
      // TODO if useful we can add functional error
      // for example not specifying categoriesPage and urlsPizzasPages at the same time
    });

    Promise.all([categoriesPromise]);

    const pages: Promise<CheerioStatic>[] = this.urlsPizzasPages.map(url => {
      return new Promise((resolve, reject) => {
        this.beforePizzaRequest().then( () => {
            get(url, requestOptions, (error, response, body) => {
              if (error || response.statusCode !== 200) {
                const err = `Error while trying to fetch the pizza provider "${
                  this.longCompanyName
                }" with the following URL: "${this.url}"`;

                reject(err);
              } else {
                resolve(cheerio.load(body));
              }
          });
        });
      });
    });

    return Promise.all(pages);
  }

  // every pizza provider can override this method
  // and define how to parse ONE page directly
  // BUT, it'd be a better idea not to override it
  // and simply define the parsing methods `getPhone`, etc
  protected parsePage(
    $: CheerioStatic,
    pizzaCategoryName: string = null
  ): { pizzasCategories: IPizzaCategoryFkWithoutId[] } {
    const pizzasCategoriesWrapper = this.getPizzasCategoriesWrapper($);

    const pizzasCategories = pizzasCategoriesWrapper
      .toArray()
      .map(pizzaCategoryHtml => this.parsePizzaWithCategory($, pizzaCategoryHtml, pizzaCategoryName));

    return { pizzasCategories };
  }

  private parsePizzaWithCategory(
    $: CheerioStatic,
    pizzaCategoryHtml: CheerioElement,
    pizzaCategoryName: string
  ): IPizzaCategoryFkWithoutId {
    const pizzaCategoryDom = $(pizzaCategoryHtml);

    // value not fetched on another page, we try on this one
    if (pizzaCategoryName === null) {
      this.getPizzaCategoryName(pizzaCategoryDom);
    }

    const pizzasDoms = this.getPizzasWrappers(pizzaCategoryDom);
    const pizzas = pizzasDoms
      .toArray()
      .map(pizzaHtml => this.parsePizza($, pizzaHtml));

    return {
      name: pizzaCategoryName,
      pizzas,
    };
  }

  private parsePizza(
    $: CheerioStatic,
    pizzaHtml: CheerioElement
  ): IPizzaFkWithoutId {
    const pizzaDom = $(pizzaHtml);

    const pizzaName = this.getPizzaName(pizzaDom);

    if (DEBUG) {
      console.log('We grabbed a new pizza! %j', pizzaName);
    }

    return {
      name: pizzaName,
      imgUrl: this.getLocalOrDistantImage(pizzaDom, pizzaName),
      ingredients: this.getCleanedIngredients(pizzaDom),
      prices: this.getPrices(pizzaDom, $),
    };
  }

  private getCleanedIngredients(pizzaDom: Cheerio): { name: string }[] {
    return (
      this.getPizzaIngredients(pizzaDom)
        // some pizzas do not have ingredients as they're already written in their title
        // for example "Poire Williams / chocolat", "Banane / Chocolat" and "Ananas / Chocolat"
        // we do not want to have empty ingredients and thus, they should be removed
        .filter(x => x !== '')
        .map(x => ({ name: x.trim() }))
    );
  }

  private getLocalOrDistantImage(pizzaDom: Cheerio, pizzaName: string): string {
    const imgLocalOrDistant = this.getPizzaImage(pizzaDom);

    const localFolderName = imgLocalOrDistant[`localFolderName`];
    const distantUrl = imgLocalOrDistant[`distantUrl`];

    if (localFolderName) {
      const imgFolderName = `${this.imgsBaseFolder}/${localFolderName}`;

      return getPathImgPizza(pizzaName, imgFolderName);
    }

    return distantUrl;
  }

  // following methods are helpers to parse a page
  abstract getPhone(): string;
  abstract getPizzasCategoriesWrapper($: CheerioStatic): Cheerio;
  abstract getPizzaCategoryName(pizzaCategoryWrapper: Cheerio): string;
  abstract getPizzasWrappers(pizzaCategoryWrapper: Cheerio): Cheerio;
  abstract getPizzaName(pizzaWrapper: Cheerio): string;
  abstract getPizzaIngredients(pizzaWrapper: Cheerio): string[];
  abstract getPrices(pizzaWrapper: Cheerio, $: CheerioStatic): number[];
  abstract getPizzaImage(
    pizzaWrapper?: Cheerio
  ): { localFolderName: string } | { distantUrl: string };

  // called before each pizza request
  // (to authenticate to a dedicated url for example)
  beforePizzaRequest() {
    return new Promise(function (resolve, reject) {
      return resolve();
    });
  }

  // called before each category request when categories are
  // on a different page
  beforeEachCategoryRequest() {
    return new Promise(function (resolve, reject) {
      return resolve();
    });
  }
}
