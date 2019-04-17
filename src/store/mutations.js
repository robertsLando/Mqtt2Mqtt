export const state = {
  clients: [],
  values: []
}

export const getters = {
  clients: state => state.clients,
  values: values => state.values
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
  }
}
