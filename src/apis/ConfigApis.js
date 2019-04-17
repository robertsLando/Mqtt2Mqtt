import axios from 'axios'

import { loadProgressBar } from 'axios-progress-bar'

if (process.env.NODE_ENV === 'development') {
  axios.defaults.baseURL = axios.defaults.socketUrl + '/api'
} else {
  axios.defaults.baseURL = '/api'
}

loadProgressBar()

export default{
  getSettings () {
    return axios.get('/settings')
      .then(response => {
        return response.data
      })
  },
  getClients () {
    return axios.get('/clients')
      .then(response => {
        return response.data
      })
  },
  updateClients (data) {
    return axios.post('/clients', data)
      .then(response => {
        return response.data
      })
  }
}
