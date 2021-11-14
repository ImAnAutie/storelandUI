import { makeStorelandRequest } from "./storelandCORE.js";

import { Iodine } from "@kingshott/iodine";
const iodine = new Iodine();

const loadBrandEdit = async function (params) {
  console.log("About to load the brand edit page, initing alpine data model");
  Alpine.store("selectedPage", "brand");
  console.log(params);

  try {
    const brandRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/brand/${params.brandId}`,
      "GET"
    );
    console.table(brandRes);
    if (brandRes.status) {
      const brand = brandRes.brand;
      Object.assign(brand, {
        fieldValidations: {
          name: true,
          logo: true,
        },
        validateField: function (fieldName) {
          const pageBrandEdit = Alpine.store("pageBrandEdit");
          switch (fieldName) {
            case "name":
              pageBrandEdit.fieldValidations.name = iodine.isValid(
                pageBrandEdit.name,
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
          console.log("Validating new brand data");
          const pageBrandEdit = Alpine.store("pageBrandEdit");
          if (!iodine.isValid(pageBrandEdit.name, ["required"])) {
            return pageBrandEdit.formSubmitError(
              "Brand name required",
              "Please enter a brand name"
            );
          }
          if (!iodine.isValid(pageBrandEdit.logo, ["required"])) {
            return pageBrandEdit.formSubmitError(
              "Brand logo required",
              "Please upload a logo for this brand"
            );
          }

          const editBrandData = {
            name: pageBrandEdit.name,
            logo: pageBrandEdit.logo,
          };
          console.log("Submtting brand edit");
          console.table(editBrandData);
          Alpine.store("loading", true);
          try {
            const editBrandRes = await makeStorelandRequest(
              `company/${Alpine.store("appCompany")._id}/brand/${
                pageBrandEdit._id
              }`,
              "PATCH",
              editBrandData
            );
            console.table(editBrandRes);
            if (editBrandRes.status) {
              console.log("Successfully edited brand");
              //@todo some sort of toast?
              const brand = editBrandRes.brand;
              router.navigate(
                router.generate("brand", {
                  brandId: brand._id,
                })
              );
            } else {
              console.log("API returned false status");
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                editBrandRes.message,
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageBrandEdit").formSubmit();
                }
              );
              return;
            }
          } catch (error) {
            //@TOOO report this
            console.log("Error editing brand");
            console.log(error);
            Alpine.store("loading", false);
            Alpine.store("appAlert").show(
              "Something went wrong",
              "A network error occured when editing this brand",
              "Cancel",
              "Try again",
              "green",
              true,
              function () {
                Alpine.store("appAlert").visible = false;
                Alpine.store("pageBrandEdit").formSubmit();
              }
            );
          }
        },
      });

      brand.deleteConfirm = {
        visible: false,
        name: "",
        confirm: async function () {
          const pageBrandEdit = Alpine.store("pageBrandEdit");
          if (
            Alpine.store("pageBrandEdit").deleteConfirm.name ==
            Alpine.store("pageBrandEdit").name
          ) {
            console.log("Deleting brand now it's confirmed");
            Alpine.store("pageBrandEdit").deleteConfirm.visible = false;
            Alpine.store("loading", true);
            try {
              const deleteBrandRes = await makeStorelandRequest(
                `company/${Alpine.store("appCompany")._id}/brand/${
                  pageBrandEdit._id
                }`,
                "DELETE"
              );
              console.table(deleteBrandRes);
              if (deleteBrandRes.status) {
                console.log("Successfully deleted brand");
                router.navigate(router.generate("brand.list"));
              } else {
                console.log("API returned false status");
                Alpine.store("loading", false);
                Alpine.store("appAlert").show(
                  "Something went wrong",
                  deleteBrandRes.message,
                  "Cancel",
                  "Try again",
                  "green",
                  true,
                  function () {
                    Alpine.store("appAlert").visible = false;
                    Alpine.store("pageBrandEdit").deleteConfirm.confirm();
                  }
                );
                return;
              }
            } catch (error) {
              //@TOOO report this
              console.log("Error deleting brand");
              console.log(error);
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                "A network error occured when deleting this brand",
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageBrandEdit").deleteConfirm.confirm();
                }
              );
            }
          }
        },
      };
      brand.delete = function () {
        Alpine.store("appAlert").show(
          "Are you sure?",
          "Deleting this brand will delete all sales channels, orders etc.. This CANNOT be undone.",
          "Cancel",
          "Yes, delete this brand",
          "red",
          true,
          function () {
            Alpine.store("appAlert").hide();
            Alpine.store("pageBrandEdit").deleteConfirm.name = "";
            Alpine.store("pageBrandEdit").deleteConfirm.visible = true;
          }
        );
      };
      Alpine.store("pageBrandEdit", brand);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading brand information. Please try again",
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
    console.log("Error fetching brand data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading brand information. Please try again",
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

const loadBrandPage = async function (params) {
  console.log("About to load the brand brand page, initing alpine data model");
  Alpine.store("selectedPage", "brand");

  try {
    const brandRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/brand/${params.brandId}`,
      "GET"
    );
    console.table(brandRes);
    if (brandRes.status) {
      const brand = brandRes.brand;
      Alpine.store("pageBrand", brand);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading brand information. Please try again",
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
    console.log("Error fetching brand data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading brand information. Please try again",
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

const loadBrandList = async function () {
  console.log("About to load the brand list page, initing alpine data model");
  Alpine.store("selectedPage", "brand");
  try {
    const brandRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/brand`,
      "GET"
    );
    console.table(brandRes);
    if (brandRes.status) {
      Alpine.store("pageBrandList", brandRes.brand);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading brand information. Please try again",
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
    console.log("Error fetching brand data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading brand information. Please try again",
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

const loadBrandNew = async function () {
  console.log("About to load the new brand page, initing alpine data model");
  Alpine.store("selectedPage", "brand");
  Alpine.store("pageBrandNew", {
    name: "",
    logo: "",
    fieldValidations: {
      name: true,
      logo: true,
    },
    validateField: function (fieldName) {
      const pageBrandNew = Alpine.store("pageBrandNew");
      switch (fieldName) {
        case "name":
          pageBrandNew.fieldValidations.name = iodine.isValid(
            pageBrandNew.name,
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
      console.log("Validating new brand data");
      const pageBrandNew = Alpine.store("pageBrandNew");
      if (!iodine.isValid(pageBrandNew.name, ["required"])) {
        return pageBrandNew.formSubmitError(
          "Brand name required",
          "Please enter a brand name"
        );
      }
      if (!iodine.isValid(pageBrandNew.logo, ["required"])) {
        return pageBrandNew.formSubmitError(
          "Brand logo required",
          "Please upload a logo for this brand"
        );
      }

      const newBrandData = {
        name: pageBrandNew.name,
        logo: pageBrandNew.logo,
      };
      console.log("Submtting new brand");
      console.table(newBrandData);
      Alpine.store("loading", true);
      try {
        const newBrandRes = await makeStorelandRequest(
          `company/${Alpine.store("appCompany")._id}/brand`,
          "POST",
          newBrandData
        );
        console.table(newBrandRes);
        if (newBrandRes.status) {
          console.log("Successfully created brand");
          router.navigate(
            router.generate("brand", {
              brandId: newBrandRes.brand._id,
            })
          );
        } else {
          console.log("API returned false status");
          Alpine.store("loading", false);
          Alpine.store("appAlert").show(
            "Something went wrong",
            newBrandRes.message,
            "Cancel",
            "Try again",
            "green",
            true,
            function () {
              Alpine.store("appAlert").visible = false;
              Alpine.store("pageBrandNew").formSubmit();
            }
          );
          return;
        }
      } catch (error) {
        //@TOOO report this
        console.log("Error creating new brand");
        console.log(error);
        Alpine.store("loading", false);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "A network error occured when creating this brand",
          "Cancel",
          "Try again",
          "green",
          true,
          function () {
            Alpine.store("appAlert").visible = false;
            Alpine.store("pageBrandNew").formSubmit();
          }
        );
      }
    },
  });
};

export { loadBrandNew, loadBrandList, loadBrandPage, loadBrandEdit };
