import { config } from "./config.js";
import { getKeycloak } from "./keycloak.js";
import { makeStorelandRequest } from "./storelandCORE.js";
window.makeStorelandRequest = makeStorelandRequest;
const keycloak = getKeycloak();

const Navigo = require("navigo");

import Alpine from "alpinejs";
window.Alpine = Alpine;
Alpine.store("config", config);

const {
  loadChannelNew,
  loadChannelPage,
  loadChannelEdit,
  loadChannelList,
} = require("./channel.js");

const {
  loadBrandNew,
  loadBrandList,
  loadBrandPage,
  loadBrandEdit,
} = require("./brand.js");

const {
  loadCompanyProdigi,
  loadCompanyEdit,
  loadCompanyPage,
  loadCompanyList,
  loadCompanyNew,
  loadUserSelectedCompany,
} = require("./company.js");

const {
  loadItemNew,
  loadItemPage,
  loadItemEdit,
  loadItemList,
} = require("./item.js");

const {
  loadPackageList,
  loadPackageNew,
  loadPackagePage,
  loadPackageEdit,
  loadPackageAssignment,
  loadPackageCategory,
} = require("./package.js");
const { loadCategoryNew } = require("./category.js");

const initKeycloak = async function () {
  console.log("initKeycloak");

  const authenticated = await keycloak.init({
    onLoad: "check-sso",
    silentCheckSsoRedirectUri:
      window.location.origin + "/silent-check-sso.html",
  });

  console.log(authenticated);
  if (authenticated) {
    const userInfo = await keycloak.loadUserInfo();
    console.log("Fetched user info from keycloak");
    console.table(userInfo);
    Alpine.store("appUser", userInfo);

    const storelandUserRes = await makeStorelandRequest(`user/me`, "GET");
    console.table(storelandUserRes);
    if (!storelandUserRes.status) {
      console.log("Failed to fetch user data from storeland CORE");
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Failed to load storeland",
        "Something went wrong fetching user data from storeland. Please reload the page and try again.",
        "Cancel",
        "Try again",
        "green",
        false,
        function () {
          location.href = "/";
        }
      );
      Alpine.start();
      return;
    }
    Alpine.store("storelandUser", storelandUserRes.user);

    const companyLoadResult = await loadUserSelectedCompany();
    if (!companyLoadResult) {
      console.log("Company load result falsey, returning");
      return false;
    }

    if (!Alpine.store("appCompany").selected) {
      Alpine.store("appAlert").show(
        "No assigned company",
        "You are not assigned to any companies. To begin create a company",
        "Cancel",
        "Create new company",
        "green",
        false,
        function () {
          Alpine.store("appAlert").visible = false;
          router.navigate(router.generate("company.new"));
        }
      );
    }

    initApp();
  } else {
    keycloak.login();
  }
  window.keycloak = keycloak;
};

const initApp = async () => {
  console.log(`I am running on version: ${config("version")}`);

  console.table(config());
  Alpine.start();
  Alpine.store("appLoading", false);
  router.resolve();
};

function load404() {
  Alpine.store("selectedPage", "404");
}

const root = `${window.location.protocol}//${
  window.location.href.split("/")[2]
}/`;
const useHash = false;
const hash = "#!"; // Defaults to: '#'
const router = new Navigo(root, useHash, hash);
window.router = router;

router.on({
  "/": {
    as: "homepage",
    uses: function () {
      console.log("I am on the home page");
      Alpine.store("loadPage")("index");
    },
  },
  "/company": {
    as: "company.list",
    uses: function () {
      console.log("I am on the list company page");
      Alpine.store("loadPage")("company/list");
    },
  },
  "/company/new": {
    as: "company.new",
    uses: function () {
      console.log("I am on the new company page");
      Alpine.store("loadPage")("company/new");
    },
  },
  "/company/:companyId": {
    as: "company",
    uses: function (params) {
      console.log("I am on the company page");
      Alpine.store("loadPage")("company/company", params);
    },
  },
  "/company/:companyId/edit": {
    as: "company.edit",
    uses: function (params) {
      console.log("I am on the company edit page");
      Alpine.store("loadPage")("company/edit", params);
    },
  },
  "/company/:companyId/prodigi": {
    as: "company.prodigi",
    uses: function (params) {
      console.log("I am on the company prodigi page");
      Alpine.store("loadPage")("company/prodigi", params);
    },
  },

  "/brand": {
    as: "brand.list",
    uses: function () {
      console.log("I am on the list brand page");
      Alpine.store("loadPage")("brand/list");
    },
  },
  "/brand/new": {
    as: "brand.new",
    uses: function () {
      console.log("I am on the new brand page");
      Alpine.store("loadPage")("brand/new");
    },
  },
  "/brand/:brandId": {
    as: "brand",
    uses: function (params) {
      console.log("I am on the brand page");
      Alpine.store("loadPage")("brand/brand", params);
    },
  },
  "/brand/:brandId/edit": {
    as: "brand.edit",
    uses: function (params) {
      console.log("I am on the brand edit page");
      Alpine.store("loadPage")("brand/edit", params);
    },
  },

  "/channel": {
    as: "channel.list",
    uses: function () {
      console.log("I am on the list channel page");
      Alpine.store("loadPage")("channel/list");
    },
  },
  "/channel/new": {
    as: "channel.new",
    uses: function () {
      console.log("I am on the new channel page");
      Alpine.store("loadPage")("channel/new");
    },
  },
  "/brand/:brandId/channel/:channelId": {
    as: "channel",
    uses: function (params) {
      console.log("I am on the channel page");
      Alpine.store("loadPage")("channel/channel", params);
    },
  },
  "/brand/:brandId/channel/:channelId/edit": {
    as: "channel.edit",
    uses: function (params) {
      console.log("I am on the channel edit page");
      Alpine.store("loadPage")("channel/edit", params);
    },
  },

  "/item": {
    as: "item.list",
    uses: function () {
      console.log("I am on the items list page");
      Alpine.store("loadPage")("item/list");
    },
  },
  "/item/new": {
    as: "item.new",
    uses: function () {
      console.log("I am on the new item page");
      Alpine.store("loadPage")("item/new");
    },
  },
  "/item/:itemId": {
    as: "item",
    uses: function (params) {
      console.log("I am on the item page");
      Alpine.store("loadPage")("item/item", params);
    },
  },
  "/item/:itemId/edit": {
    as: "item.edit",
    uses: function (params) {
      console.log("I am on the channel edit page");
      Alpine.store("loadPage")("item/edit", params);
    },
  },

  "/package": {
    as: "package.list",
    uses: function () {
      console.log("I am on the packages list page");
      Alpine.store("loadPage")("package/list");
    },
  },
  "/package/new": {
    as: "package.new",
    uses: function () {
      console.log("I am on the new package page");
      Alpine.store("loadPage")("package/new");
    },
  },
  "/package/:packageId": {
    as: "package",
    uses: function (params) {
      console.log("I am on the package page");
      Alpine.store("loadPage")("package/package", params);
    },
  },
  "/package/:packageId/edit": {
    as: "package.edit",
    uses: function (params) {
      console.log("I am on the package edit page");
      Alpine.store("loadPage")("package/edit", params);
    },
  },
  "/package/:packageId/assignment": {
    as: "package.assignment",
    uses: function (params) {
      console.log("I am on the package assignment page");
      Alpine.store("loadPage")("package/assignment", params);
    },
  },

  "/package/:packageId/category": {
    as: "package.category",
    uses: function (params) {
      console.log("I am on the package category page");
      Alpine.store("loadPage")("package/category", params);
    },
  },
  "/category": {
    as: "category.list",
    uses: function () {
      console.log("I am on the categories list page");
      Alpine.store("loadPage")("category/list");
    },
  },
  "/category/new": {
    as: "category.new",
    uses: function () {
      console.log("I am on the new category page");
      Alpine.store("loadPage")("category/new");
    },
  },
  "/category/:categoryId": {
    as: "category",
    uses: function (params) {
      console.log("I am on the category page");
      Alpine.store("loadPage")("category/category", params);
    },
  },
  "/category/:categoryId/edit": {
    as: "category.edit",
    uses: function (params) {
      console.log("I am on the category edit page");
      Alpine.store("loadPage")("category/edit", params);
    },
  },
});

router.notFound(function () {
  console.log("Route not found");
  load404();
});

Alpine.store("utilityFunctions", {
  navigate: function (route, params) {
    router.navigate(router.generate(route, params));
  },
  isEven: function isEven(value) {
    if (value % 2 == 0) return true;
    else return false;
  },
  fileToDataUrl: async function (file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        //A blank response here, handles the case where the user has not selected a file
        resolve("");
      }
      var reader = new FileReader();
      reader.onload = function (event) {
        resolve(event.target.result);
      };
      reader.readAsDataURL(file);
    });
  },
});
Alpine.store("appIssues", []);
Alpine.store("customers", {
  new: [],
  all: [],
});
Alpine.store("pendingOrders", []);
Alpine.store("appAlert", {
  title: "",
  message: "",
  cancelText: "",
  actionText: "",
  showCancel: true,
  actionColor: "red",
  get actionClass() {
    return `bg-${this.actionColor}-600 hover:bg-${this.actionColor}-700 focus:ring-${this.actionColor}-500 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`;
  },
  visible: false,
  actionFunction: function () {
    console.log("No action function assigned");
  },
  show: function (
    title,
    message,
    cancelText,
    actionText,
    actionColor,
    showCancel,
    actionFunction
  ) {
    this.title = title;
    this.message = message;
    this.cancelText = cancelText;
    this.actionText = actionText;
    this.actionColor = actionColor;
    this.showCancel = showCancel;
    this.actionFunction = actionFunction;

    this.visible = true;
  },
  hide: function () {
    this.visible = false;
  },
});
Alpine.store("appUser", {
  displayName: "",
  logo: "",
});
Alpine.store("appLogo", "/img/logo.png");
Alpine.store("switchCompany", function (selectedCompanyId, reloadAfter) {
  console.log("Switch company");
  localStorage.selectedCompanyId = selectedCompanyId;
  if (reloadAfter) {
    location.reload();
  }
});
Alpine.store("mainPage", "");
Alpine.store("loadFragment", async function (fragment) {
  const response = await fetch(`/fragments/${fragment}.html`);
  const fragmentHtml = await response.text();
  const isFragment = fragmentHtml.startsWith("<!-- FRAGMENT -->");
  if (isFragment) {
    //@todo PLEASE figure out a better way to do this
    setTimeout(function () {
      router.updatePageLinks();
    }, 50);

    return fragmentHtml;
  } else {
    return "<!-- 404 on fragment load -->";
  }
});
Alpine.store("loadPage", async function (page, params) {
  Alpine.store("appLoading", false);
  Alpine.store("loading", true);
  console.log(`Loading page: ${page}`);
  let response;
  try {
    response = await fetch(`/pages/${page}.html`);
  } catch (e) {
    console.log(e);
    Alpine.store("loading", false);
    Alpine.store("selectedPage", "");
    return Alpine.store("appAlert").show(
      "Something went wrong",
      "A network error occured loading this page. Please check your internet connection",
      "Cancel",
      "Return home",
      "green",
      false,
      function () {
        location.href = "/";
      }
    );
  }
  console.log("Got response");
  Alpine.store("selectedPage", "");
  switch (page) {
    //It's important to await the load functions so data is loaded
    //Before we carry on and load the HTML
    case "index":
      //We have no stats to load
      //but we want to set selected page so sidebar shows properly
      Alpine.store("selectedPage", "index");
      //await loadIndexPage(params);
      break;

    case "company/prodigi":
      await loadCompanyProdigi(params);
      break;
    case "company/edit":
      await loadCompanyEdit(params);
      break;
    case "company/company":
      await loadCompanyPage(params);
      break;
    case "company/list":
      await loadCompanyList(params);
      break;
    case "company/new":
      await loadCompanyNew(params);
      break;
    case "brand/edit":
      await loadBrandEdit(params);
      break;
    case "brand/brand":
      await loadBrandPage(params);
      break;
    case "brand/list":
      await loadBrandList(params);
      break;
    case "brand/new":
      await loadBrandNew(params);
      break;

    case "channel/list":
      await loadChannelList(params);
      break;
    case "channel/new":
      await loadChannelNew(params);
      break;
    case "channel/channel":
      await loadChannelPage(params);
      break;
    case "channel/edit":
      await loadChannelEdit(params);
      break;

    case "item/new":
      await loadItemNew(params);
      break;
    case "item/list":
      await loadItemList(params);
      break;
    case "item/item":
      await loadItemPage(params);
      break;
    case "item/edit":
      await loadItemEdit(params);
      break;

    case "package/list":
      await loadPackageList(params);
      break;
    case "package/new":
      await loadPackageNew(params);
      break;
    case "package/package":
      await loadPackagePage(params);
      break;
    case "package/edit":
      await loadPackageEdit(params);
      break;
    case "package/assignment":
      await loadPackageAssignment(params);
      break;
    case "package/category":
      await loadPackageCategory(params);
      break;

    case "category/new":
      await loadCategoryNew(params);
      break;
  }

  const pageHtml = await response.text();
  const isPage = pageHtml.startsWith("<!-- PAGE -->");
  if (isPage) {
    Alpine.store("mainPage", pageHtml);
    setTimeout(function () {
      router.updatePageLinks();
    }, 25);
  } else {
    load404();
  }
  Alpine.store("loading", false);
});
Alpine.store("mainContent", "");
Alpine.store("appLoading", true);
Alpine.store("loading", false);
Alpine.store("appCompany", {
  selected: false,
});
Alpine.store("auth", {
  signOut: function () {
    keycloak.logout();
  },
  manageAccount: function () {
    keycloak.accountManagement();
  },
});

initKeycloak();
