import axios from 'axios'

import { loadProgressBar } from 'axios-progress-bar'

if (process.env.NODE_ENV === 'development') {
  // process.PORT is imported in config/dev.env.js
  axios.defaults.baseURL = location.protocol + '//' + location.hostname + ':' + process.env.PORT + '/api'
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
  updateSettings (data) {
    return axios.post('/settings', data)
      .then(response => {
        return response.data
      })
  }
}
