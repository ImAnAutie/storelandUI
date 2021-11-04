export function config (key) {
    const configStore = {}
    // DO NOT CHANGE THIS
    // It will be automatically set when deployed via CI
    // (see github.com/OkoWsc/ParkPlanrFirebase CI config for info
    configStore.version = '{{APP_VERSION_HERE}}_1501'
    // END OF RANTY WARNING NOTICE
  
    if (!key) {
      return configStore
    }
    if (configStore[key]) {
      return configStore[key]
    } else {
      throw new Error(`Config key: ${key} unknown`)
    }
  }