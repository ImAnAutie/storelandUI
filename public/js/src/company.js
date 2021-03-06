import { makeStorelandRequest } from "./storelandCORE.js";

import { Iodine } from "@kingshott/iodine";
const iodine = new Iodine();

const loadCompanyProdigi = async function (params) {
  console.log(
    "About to load the company prodigi page, initing alpine data model"
  );
  Alpine.store("selectedPage", "company");
  console.log(params);
  if (params.companyId == "selected") {
    params.companyId = localStorage.selectedCompanyId;
    router.navigate(router.generate("company.edit", params));
    return;
  }

  try {
    const companyRes = await makeStorelandRequest(
      `company/${params.companyId}`,
      "GET"
    );
    console.table(companyRes);
    if (companyRes.status) {
      const company = companyRes.company;
      Object.assign(company, {
        fieldValidations: {
          key: true,
        },
        validateField: function (fieldName) {
          const pageCompanyProdigi = Alpine.store("pageCompanyProdigi");
          switch (fieldName) {
            case "name":
              pageCompanyProdigi.fieldValidations.key = iodine.isValid(
                pageCompanyProdigi.key,
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
          console.log("Validating company prodigi data");
          const pageCompanyProdigi = Alpine.store("pageCompanyProdigi");
          if (!iodine.isValid(pageCompanyProdigi.key, ["required"])) {
            return pageCompanyProdigi.formSubmitError(
              "prodigi API key required",
              "A prodigi API key is required"
            );
          }
          const editCompanyData = {
            prodigiApiKey: pageCompanyProdigi.key,
          };
          console.log("Submtting company edit");
          console.table(editCompanyData);
          Alpine.store("loading", true);
          try {
            const editCompanyRes = await makeStorelandRequest(
              `company/${
                Alpine.store("pageCompanyProdigi")._id
              }/config/prodigi`,
              "PATCH",
              editCompanyData
            );
            console.table(editCompanyRes);
            if (editCompanyRes.status) {
              console.log("Successfully edited company prodigi information");
              //@todo some sort of toast?
              router.navigate(
                router.generate("company", {
                  companyId: Alpine.store("pageCompanyProdigi")._id,
                })
              );
            } else {
              console.log("API returned false status");
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                editCompanyRes.message,
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageCompanyEdit").formSubmit();
                }
              );
              return;
            }
          } catch (error) {
            //@TOOO report this
            console.log("Error editing company");
            console.log(error);
            Alpine.store("loading", false);
            Alpine.store("appAlert").show(
              "Something went wrong",
              "A network error occured when editing the prodigi information for this company",
              "Cancel",
              "Try again",
              "green",
              true,
              function () {
                Alpine.store("appAlert").visible = false;
                Alpine.store("pageCompanyProdigi").formSubmit();
              }
            );
          }
        },
      });

      Alpine.store("pageCompanyProdigi", company);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
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
      return;
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching company data");
    console.log(error);
    Alpine.store("loading", false);
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
    return;
  }
};

const loadCompanyEdit = async function (params) {
  console.log("About to load the company edit page, initing alpine data model");
  Alpine.store("selectedPage", "company");
  console.log(params);
  if (params.companyId == "selected") {
    params.companyId = localStorage.selectedCompanyId;
    router.navigate(router.generate("company.edit", params));
    return;
  }

  try {
    const companyRes = await makeStorelandRequest(
      `company/${params.companyId}`,
      "GET"
    );
    console.table(companyRes);
    if (companyRes.status) {
      const company = companyRes.company;
      Object.assign(company, {
        fieldValidations: {
          name: true,
          logo: true,
        },
        validateField: function (fieldName) {
          const pageCompanyEdit = Alpine.store("pageCompanyEdit");
          switch (fieldName) {
            case "name":
              pageCompanyEdit.fieldValidations.name = iodine.isValid(
                pageCompanyEdit.name,
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
          const pageCompanyEdit = Alpine.store("pageCompanyEdit");
          if (!iodine.isValid(pageCompanyEdit.name, ["required"])) {
            return pageCompanyEdit.formSubmitError(
              "Company name required",
              "Please enter a company name"
            );
          }
          if (!iodine.isValid(pageCompanyEdit.logo, ["required"])) {
            return pageCompanyEdit.formSubmitError(
              "Company logo required",
              "Please upload a logo for your company"
            );
          }

          const editCompanyData = {
            name: pageCompanyEdit.name,
            logo: pageCompanyEdit.logo,
          };
          console.log("Submtting company edit");
          console.table(editCompanyData);
          Alpine.store("loading", true);
          try {
            const editCompanyRes = await makeStorelandRequest(
              `company/${params.companyId}`,
              "PATCH",
              editCompanyData
            );
            console.table(editCompanyRes);
            if (editCompanyRes.status) {
              console.log("Successfully edited company");
              //@todo some sort of toast?
              const company = editCompanyRes.company;
              if (company._id == Alpine.store("appCompany")._id) {
                console.log("Updating local company data");
                company.selected = true;
                Alpine.store("appCompany", company);
                Alpine.store("appLogo", company.logo);
              }
              router.navigate(
                router.generate("company", {
                  companyId: company._id,
                })
              );
            } else {
              console.log("API returned false status");
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                editCompanyRes.message,
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageCompanyEdit").formSubmit();
                }
              );
              return;
            }
          } catch (error) {
            //@TOOO report this
            console.log("Error editing company");
            console.log(error);
            Alpine.store("loading", false);
            Alpine.store("appAlert").show(
              "Something went wrong",
              "A network error occured when editing this company",
              "Cancel",
              "Try again",
              "green",
              true,
              function () {
                Alpine.store("appAlert").visible = false;
                Alpine.store("pageCompanyEdit").formSubmit();
              }
            );
          }
        },
      });

      company.deleteConfirm = {
        visible: false,
        name: "",
        confirm: async function () {
          const pageCompanyEdit = Alpine.store("pageCompanyEdit");
          if (
            Alpine.store("pageCompanyEdit").deleteConfirm.name ==
            Alpine.store("pageCompanyEdit").name
          ) {
            console.log("Deleting company now it's confirmed");
            Alpine.store("pageCompanyEdit").deleteConfirm.visible = false;
            Alpine.store("loading", true);
            try {
              const deleteCompanyRes = await makeStorelandRequest(
                `company/${params.companyId}`,
                "DELETE"
              );
              console.table(deleteCompanyRes);
              if (deleteCompanyRes.status) {
                console.log("Successfully deleted company");
                if (
                  Alpine.store("pageCompanyEdit")._id ==
                  localStorage.selectedCompanyId
                ) {
                  console.log(
                    "Currently selected company deleted, clearing selection"
                  );
                  delete localStorage.selectedCompanyId;
                  location.href = "/company";
                } else {
                  router.navigate(router.generate("company.list"));
                }
              } else {
                console.log("API returned false status");
                Alpine.store("loading", false);
                Alpine.store("appAlert").show(
                  "Something went wrong",
                  deleteCompanyRes.message,
                  "Cancel",
                  "Try again",
                  "green",
                  true,
                  function () {
                    Alpine.store("appAlert").visible = false;
                    Alpine.store("pageCompanyEdit").deleteConfirm.confirm();
                  }
                );
                return;
              }
            } catch (error) {
              //@TOOO report this
              console.log("Error deleting company");
              console.log(error);
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                "A network error occured when deleting this company",
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageCompanyEdit").deleteConfirm.confirm();
                }
              );
            }
          }
        },
      };
      company.delete = function () {
        Alpine.store("appAlert").show(
          "Are you sure?",
          "Deleting this company will delete all brands, sales channels, orders etc.. for the company. This CANNOT be undone.",
          "Cancel",
          "Yes, delete this company",
          "red",
          true,
          function () {
            Alpine.store("appAlert").hide();
            Alpine.store("pageCompanyEdit").deleteConfirm.name = "";
            Alpine.store("pageCompanyEdit").deleteConfirm.visible = true;
          }
        );
      };
      Alpine.store("pageCompanyEdit", company);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
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
      return;
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching company data");
    console.log(error);
    Alpine.store("loading", false);
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
    return;
  }
};

const loadCompanyPage = async function (params) {
  console.log(
    "About to load the company company page, initing alpine data model"
  );
  Alpine.store("selectedPage", "company");
  console.log(params);
  if (params.companyId == "selected") {
    params.companyId = localStorage.selectedCompanyId;
    router.navigate(router.generate("company", params));
    return;
  }

  try {
    const companyRes = await makeStorelandRequest(
      `company/${params.companyId}`,
      "GET"
    );
    console.table(companyRes);
    if (companyRes.status) {
      const company = companyRes.company;
      Alpine.store("pageCompany", company);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
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
      return;
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching company data");
    console.log(error);
    Alpine.store("loading", false);
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
    return;
  }
};

const loadCompanyList = async function () {
  console.log("About to load the company list page, initing alpine data model");
  Alpine.store("selectedPage", "company");
  try {
    const companyRes = await makeStorelandRequest(`company/`, "GET");
    console.table(companyRes);
    if (companyRes.status) {
      Alpine.store("pageCompanyList", companyRes.company);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
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
      return;
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching company data");
    console.log(error);
    Alpine.store("loading", false);
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
    return;
  }
};

const loadCompanyNew = async function () {
  console.log("About to load the new company page, initing alpine data model");
  Alpine.store("selectedPage", "company");
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
        const newCompanyRes = await makeStorelandRequest(
          `company/`,
          "POST",
          newCompanyData
        );
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
};

const loadUserSelectedCompany = async function () {
  if (localStorage.selectedCompanyId) {
    console.log("User has selected a company");
    try {
      const companyRes = await makeStorelandRequest(
        `company/${localStorage.selectedCompanyId}`,
        "GET"
      );
      console.table(companyRes);
      if (companyRes.status) {
        console.log("Successfully selected company");
        const selectedCompany = companyRes.company;
        selectedCompany.selected = true;
        Alpine.store("appCompany", selectedCompany);
        Alpine.store("appLogo", selectedCompany.logo);
        return true;
      } else {
        console.log("API returned false status, treating as non assigned");
        delete localStorage.selectedCompanyId;
        location.reload();
        return false;
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
      return false;
    }
  } else {
    try {
      const companyRes = await makeStorelandRequest(`company/`, "GET");
      console.table(companyRes);
      if (companyRes.status) {
        if (companyRes.company.length) {
          console.log(`Auto selecting company: ${companyRes.company[0]._id}`);
          Alpine.store("switchCompany")(companyRes.company[0]._id);
          location.reload();
          return false;
        } else {
          console.log("User has no companies");
          return true;
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
        return false;
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
      return false;
    }
  }
};
export {
  loadCompanyProdigi,
  loadCompanyEdit,
  loadCompanyPage,
  loadCompanyList,
  loadCompanyNew,
  loadUserSelectedCompany,
};
