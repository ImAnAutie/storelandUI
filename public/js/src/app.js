import { config } from "./config.js";

const Navigo = require("navigo");

import Alpine from "alpinejs";
window.Alpine = Alpine;

import { Iodine } from '@kingshott/iodine';
const iodine = new Iodine();

const initKeycloak = async function () {
    console.log("initKeycloak");
  var keycloak = new Keycloak({url: "https://keycloak.dicsolve.com/auth",
  realm: "storeland",
  clientId: "storelandUI"});

  const authenticated = await keycloak.init({
    
    onLoad: "check-sso",
    silentCheckSsoRedirectUri:
      window.location.origin + "/silent-check-sso.html",
  });

  console.log(authenticated);
  if (authenticated) {
    const userInfo = await keycloak.loadUserInfo();
    console.log("Fetched user info");
    console.table(userInfo);
    Alpine.store("appUser", userInfo);
    Alpine.store("appCompany", {
      //            name: "Demo company",
      //            logo: "/img/logo.png",
      selected: false,
    });

    //@TODO implement actual check for company data
    if (!Alpine.store("appCompany").selected) {
      Alpine.store("appAlert").show(
        "No assigned company",
        "You are not assigned to any companies. To begin create a company",
        "Cancel",
        "Create new company",
        "green",
        false,
        function() {
            Alpine.store("appAlert").hide();
            router.navigate(router.generate('company.new'));
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
  Alpine.store("appLoading",true);
  router.resolve();
};

function load404() {
  return false;
  // TODO: This but better
  $("#contentDiv").html("4 oh 4");
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
      Alpine.store("loadPage")('index');
    },
  },
  "/company/new": {
    as: "company.new",
    uses: function () {
      console.log("I am on the new company page");
      Alpine.store("loadPage")('company/new');
    },
  },
});

router.notFound(function () {
  console.log("Route not found");
  load404();
});

Alpine.store("utilityFunctions", {
  fileToDataUrl: async function(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        //A blank response here, handles the case where the user has not selected a file  
        resolve("");
      }
      var reader = new FileReader();
      reader.onload = function(event) {
          resolve(event.target.result);
      };
      reader.readAsDataURL(file);
    });
  }
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
    actionFunction: function() { console.log("No action function assigned")},
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

  Alpine.store("mainPage", "");
  Alpine.store("loadFragment", async function (fragment) {
    const response = await fetch(`/fragments/${fragment}.html`);
    return await response.text();
  });
  Alpine.store("loadPage", async function (page) {
    Alpine.store("appLoading",false);
    Alpine.store("loading",true);
      console.log(`Loading page: ${page}`);
    const response = await fetch(`/pages/${page}.html`);
    console.log("Got response");
    switch(page) {
      case "company/new":
        console.log("About to load the new company page, initing alpine data model");
        Alpine.store("pageCompanyNew",{
          name: "",
          logo: "",
          acceptedTerms: false,
          fieldValidations: {
            name: true,
            logo: true,
            acceptedTerms: true
          },
          validateField: function(fieldName) {
            const pageCompanyNew = Alpine.store("pageCompanyNew");
            switch (fieldName) {
              case "name":
                pageCompanyNew.fieldValidations.name =  iodine.isValid(pageCompanyNew.name, ['required']);
                break;
            }
          },
          formSubmitError: function(title,message) {
            Alpine.store("appAlert").show(
              title,
              message,
              "Cancel",
              "Ok",
              "gray",
              false,
              function() {
                  Alpine.store("appAlert").hide();
              }
            )
          },
          formSubmit: async function() {
            console.log("Validating new company data");
            const pageCompanyNew = Alpine.store("pageCompanyNew");
            if (!iodine.isValid(pageCompanyNew.name, ['required'])) {
              return pageCompanyNew.formSubmitError("Company name required", "Please enter a company name");
            }
            if (!iodine.isValid(pageCompanyNew.logo, ['required'])) {
              return pageCompanyNew.formSubmitError("Company logo required", "Please upload a logo for your company");
            }
            if (!pageCompanyNew.acceptedTerms) {
              return pageCompanyNew.formSubmitError("Terms and conditions", "You need to read and accept our terms and conditions");
            }

            const newCompanyData = {
              name: pageCompanyNew.name,
              logo: pageCompanyNew.logo,
            };
            console.log("Submtting new company");
            console.table(newCompanyData);
            Alpine.store("appAlert").show(
              "Mock request data",
              JSON.stringify(newCompanyData),
              "Cancel",
              "Ok",
              "gray",
              false,
              function() {
                  Alpine.store("appAlert").hide();
              }
            )
            //@TODO actually do it
          }
        })
        break;
    }
    Alpine.store("mainPage", await response.text());
    Alpine.store("loading",false);
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