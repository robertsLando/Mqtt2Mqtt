export const state = {
  clients: [],
  values: [],
  maps: []
}

export const getters = {
  clients: state => state.clients,
  values: state => state.values,
  maps: state => state.maps,
  configuration: state => JSON.parse(JSON.stringify(state))
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
    // JSON Configuration version
      state.version = 1;

      state.clients = data.clients || [];
      state.values = data.values || [];
      state.maps = data.maps || [];
  }
}
