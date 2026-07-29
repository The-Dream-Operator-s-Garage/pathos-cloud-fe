import axios from 'axios'

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pathos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // City-rounded 'lat,lon' written by stores/geo.js when the user agreed to
  // share their location — the API stamps it onto any moment it mints.
  const geo = localStorage.getItem('pathos_geo')
  if (geo) config.headers['X-Pathos-Geo'] = geo
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pathos_token')
      localStorage.removeItem('pathos_user')
      // App uses hash routing — a bare '/auth' navigates to the wrong place.
      if (!window.location.hash.startsWith('#/auth')) {
        window.location.href = window.location.origin + '/#/auth'
      }
    }
    return Promise.reject(err)
  }
)

export default api
