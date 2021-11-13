import { config } from "./config.js";
import { getKeycloak } from "./keycloak.js";
const keycloak = getKeycloak();

import { Iodine } from "@kingshott/iodine";
const iodine = new Iodine();

const loadChannelNew = async function () {
  console.log("About to load the new channel page, initing alpine data model");
  Alpine.store("selectedPage", "channel");

  // Load the brand list
  let brandList = [];
  try {
    const brandReq = await fetch(
      `${config("storelandCORE")}/company/${
        Alpine.store("appCompany")._id
      }/brand`,
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
    const brandRes = await brandReq.json();
    console.table(brandRes);
    if (brandRes.status) {
      brandList = brandRes.brand;
      if (!brandList.length) {
        return Alpine.store("appAlert").show(
          "Missing brand",
          "You need to create a brand before you can create a channel",
          "Cancel",
          "Create brand",
          "green",
          false,
          function () {
            Alpine.store("appAlert").hide();
            router.navigate(router.generate("brand.new"));
          }
        );
      }
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      return Alpine.store("appAlert").show(
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
    }
  } catch (error) {
    //@TOOO rep ort this
    console.log("Error fetching brand data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    return Alpine.store("appAlert").show(
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
  }

  Alpine.store("pageChannelNew", {
    name: "",
    brand: "",
    type: "",
    fieldValidations: {
      name: true,
      brand: true,
      type: true,
    },
    brandList: brandList,
    validateField: function (fieldName) {
      const pageChannelNew = Alpine.store("pageChannelNew");
      switch (fieldName) {
        case "name":
          pageChannelNew.fieldValidations.name = iodine.isValid(
            pageChannelNew.name,
            ["required"]
          );
        case "brand":
          pageChannelNew.fieldValidations.brand = iodine.isValid(
            pageChannelNew.brand,
            ["required"]
          );
          break;
        case "type":
          pageChannelNew.fieldValidations.type = iodine.isValid(
            pageChannelNew.type,
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
      console.log("Validating new channel data");
      const pageChannelNew = Alpine.store("pageChannelNew");
      if (!iodine.isValid(pageChannelNew.name, ["required"])) {
        return pageChannelNew.formSubmitError(
          "Channel name required",
          "Please enter a channel name"
        );
      }

      if (!iodine.isValid(pageChannelNew.brand, ["required"])) {
        return pageChannelNew.formSubmitError(
          "Brand required",
          "Please select a brand for this channel"
        );
      }
      if (!iodine.isValid(pageChannelNew.type, ["required"])) {
        return pageChannelNew.formSubmitError(
          "Type required",
          "Please select a type for this channel"
        );
      }

      const newChannelData = {
        name: pageChannelNew.name,
        type: pageChannelNew.type,
      };
      console.log("Submtting new channel");
      console.table(newChannelData);
      Alpine.store("loading", true);
      try {
        await keycloak.updateToken(30);
        const newChannelReq = await fetch(
          `${config("storelandCORE")}/company/${
            Alpine.store("appCompany")._id
          }/brand/${pageChannelNew.brand}/channel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${keycloak.token}`,
            },
            body: JSON.stringify(newChannelData),
          }
        );
        console.log("Got response");
        const newChannelRes = await newChannelReq.json();
        console.table(newChannelRes);
        if (newChannelRes.status) {
          console.log("Successfully created channel");
          router.navigate(
            router.generate("channel", {
              brandId: pageChannelNew.brand,
              channelId: newChannelRes.channel._id,
            })
          );
        } else {
          console.log("API returned false status");
          Alpine.store("loading", false);
          Alpine.store("appAlert").show(
            "Something went wrong",
            newChannelRes.message,
            "Cancel",
            "Try again",
            "green",
            true,
            function () {
              Alpine.store("appAlert").visible = false;
              Alpine.store("pageChannelNew").formSubmit();
            }
          );
          return;
        }
      } catch (error) {
        //@TOOO report this
        console.log("Error creating new channel");
        console.log(error);
        Alpine.store("loading", false);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "A network error occured when creating this channel",
          "Cancel",
          "Try again",
          "green",
          true,
          function () {
            Alpine.store("appAlert").visible = false;
            Alpine.store("pageChannelNew").formSubmit();
          }
        );
      }
    },
  });
};

export { loadChannelNew };
