import { config } from "./config.js";

const Navigo = require("navigo");

import Alpine from "alpinejs";
window.Alpine = Alpine;

import { Iodine } from "@kingshott/iodine";
const iodine = new Iodine();

const initKeycloak = async function () {
  console.log("initKeycloak");
  var keycloak = new Keycloak({
    url: "https://keycloak.dicsolve.com/auth",
    realm: "storeland",
    clientId: "storelandUI",
  });

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

    const storelandUserReq = await fetch(`${config("storelandCORE")}/user/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keycloak.token}`,
      },
      body: null,
    });
    console.log("Got response");
    const storelandUserRes = await storelandUserReq.json();
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
      Alpine.start()
      return;
    }
    Alpine.store("storelandUser", storelandUserRes.user);

    if (localStorage.selectedCompanyId) {
      console.log("User has selected a company");
      try {
        await keycloak.updateToken(30);
        const companyReq = await fetch(
          `${config("storelandCORE")}/company/${
            localStorage.selectedCompanyId
          }`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${keycloak.token}`,
            },
            body: null,
          }
        );
        console.log("Got response");
        const companyRes = await companyReq.json();
        console.table(companyRes);
        if (companyRes.status) {
          console.log("Successfully selected company");
          const selectedCompany = companyRes.company;
          selectedCompany.selected = true;
          Alpine.store("appCompany", selectedCompany);
          Alpine.store("appLogo", selectedCompany.logo);
        } else {
          console.log("API returned false status, treating as non assigned");
          delete localStorage.selectedCompanyId;
          location.reload();
          return;
        }
      } catch (error) {
        //@TOOO report this
        console.log("Error fetching company data");
        console.log(error);
        Alpine.store("appLoading", true);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "Failed loading company information. Please try again",
          "Cancel",
          "Try again",
          "green",
          false,
          function () {
            location.reload();
          }
        );
        Alpine.start();
        return;
      }
    } else {
      try {
        await keycloak.updateToken(30);
        const companyReq = await fetch(
          `${config("storelandCORE")}/company/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${keycloak.token}`,
            },
            body: null,
          }
        );
        console.log("Got response");
        const companyRes = await companyReq.json();
        console.table(companyRes);
        if (companyRes.status) {
          if (companyRes.company) {
            console.log(`Auto selecting company: ${companyRes.company[0]._id}`);
            Alpine.store("switchCompany")(companyRes.company[0]._id);
            location.reload();
            return; 
          } else {
            console.log("User has no companies")
            delete localStorage.selectedCompanyId;
            location.reload();
            }
        } else {
          console.log("API returned false status, something went wrong");
          Alpine.store("appLoading", true);
          Alpine.store("appAlert").show(
            "Something went wrong",
            "Failed loading company information. Please try again",
            "Cancel",
            "Try again",
            "green",
            false,
            function () {
              location.reload();
            }
          );
          Alpine.start();
            return;
        }
      } catch (error) {
        //@TOOO report this
        console.log("Error fetching company data");
        console.log(error);
        Alpine.store("appLoading", true);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "Failed loading company information. Please try again",
          "Cancel",
          "Try again",
          "green",
          false,
          function () {
            location.reload();
          }
        );
        Alpine.start();
        return;
      }
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
    //@todo a nicer 404 page
    Alpine.store("mainPage", "4 oh 4");
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
      Alpine.store("loadPage")("company/company");
    },
  },
});

router.notFound(function () {
  console.log("Route not found");
  load404();
});

Alpine.store("utilityFunctions", {
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
Alpine.store("switchCompany", function (selectedCompanyId) {
  console.log("Switch company");
  localStorage.selectedCompanyId = selectedCompanyId;
});
Alpine.store("mainPage", "");
Alpine.store("loadFragment", async function (fragment) {
  const response = await fetch(`/fragments/${fragment}.html`);
  const fragmentHtml = await response.text();
  const isFragment = fragmentHtml.startsWith('<!-- FRAGMENT -->')
  if (isFragment) {

    //@todo PLEASE figure out a better way to do this
    setTimeout(function() {
      router.updatePageLinks()
    }, 50)

    return fragmentHtml;
  } else {
    return "<!-- 404 on fragment load -->";
  }
});
Alpine.store("loadPage", async function (page) {
  Alpine.store("appLoading", false);
  Alpine.store("loading", true);
  console.log(`Loading page: ${page}`);
  const response = await fetch(`/pages/${page}.html`);
  console.log("Got response");
  switch (page) {
    case "company/new":
      console.log(
        "About to load the new company page, initing alpine data model"
      );
      Alpine.store("pageCompanyNew", {
        name: "",
        logo: "",
        acceptedTerms: false,
        fieldValidations: {
          name: true,
          logo: true,
          acceptedTerms: true,
        },
        validateField: function (fieldName) {
          const pageCompanyNew = Alpine.store("pageCompanyNew");
          switch (fieldName) {
            case "name":
              pageCompanyNew.fieldValidations.name = iodine.isValid(
                pageCompanyNew.name,
                ["required"]
              );
              break;
          }
        },
        formSubmitError: function (title, message) {
          Alpine.store("appAlert").show(
            title,
            message,
            "Cancel",
            "Ok",
            "gray",
            false,
            function () {
              Alpine.store("appAlert").hide();
            }
          );
        },
        formSubmit: async function () {
          console.log("Validating new company data");
          const pageCompanyNew = Alpine.store("pageCompanyNew");
          if (!iodine.isValid(pageCompanyNew.name, ["required"])) {
            return pageCompanyNew.formSubmitError(
              "Company name required",
              "Please enter a company name"
            );
          }
          if (!iodine.isValid(pageCompanyNew.logo, ["required"])) {
            return pageCompanyNew.formSubmitError(
              "Company logo required",
              "Please upload a logo for your company"
            );
          }
          if (!pageCompanyNew.acceptedTerms) {
            return pageCompanyNew.formSubmitError(
              "Terms and conditions",
              "You need to read and accept our terms and conditions"
            );
          }

          const newCompanyData = {
            name: pageCompanyNew.name,
            logo: pageCompanyNew.logo,
          };
          console.log("Submtting new company");
          console.table(newCompanyData);
          Alpine.store("loading", true);
          try {
            await keycloak.updateToken(30);
            const newCompanyReq = await fetch(
              `${config("storelandCORE")}/company`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${keycloak.token}`,
                },
                body: JSON.stringify(newCompanyData),
              }
            );
            console.log("Got response");
            const newCompanyRes = await newCompanyReq.json();
            console.table(newCompanyRes);
            if (newCompanyRes.status) {
              console.log("Successfully created company");
              Alpine.store("switchCompany")(newCompanyRes.company._id);
              location.href = router.generate("company", {
                companyId: newCompanyRes.company._id,
              });
            } else {
              console.log("API returned false status");
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                newCompanyRes.message,
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageCompanyNew").formSubmit();
                }
              );
              return;
            }
          } catch (error) {
            //@TOOO report this
            console.log("Error creating new company");
            console.log(error);
            Alpine.store("loading", false);
            Alpine.store("appAlert").show(
              "Something went wrong",
              "A network error occured when creating a company",
              "Cancel",
              "Try again",
              "green",
              true,
              function () {
                Alpine.store("appAlert").visible = false;
                Alpine.store("pageCompanyNew").formSubmit();
              }
            );
          }
        },
      });
      break;
  }

  const pageHtml = await response.text();
  const isPage = pageHtml.startsWith('<!-- PAGE -->')
  if (isPage) {
    Alpine.store("mainPage", pageHtml);
    router.updatePageLinks();
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
