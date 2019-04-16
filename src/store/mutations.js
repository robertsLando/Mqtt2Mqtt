export const state = {
  settings: {}
}

export const getters = {
  settings: state => state.settings
}

export const actions = {
  init (store, data) {
    if(data){
      store.commit('initSettings', data.settings);
    }
  },
  import (store, settings) {
    store.commit('initSettings', settings);
  }
}

export const mutations = {
  initSettings(state, conf){
    if(conf){
      state.settings = conf.settings || {};
    }
  }
}
