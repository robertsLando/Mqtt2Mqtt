export const state = {
  clients: [],
  values: [],
  maps: []
}

export const getters = {
  clients: state => state.clients,
  values: state => state.values,
  maps: state => state.maps
}

export const actions = {
  init (store, data) {
    if(data){
      store.commit('initSettings', data);
    }
  }
}

export const mutations = {
  initSettings(state, data){
      state.clients = data.clients || [];
      state.values = data.values || [];
      state.maps = data.maps || [];
  }
}
