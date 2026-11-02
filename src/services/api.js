import axios from 'axios'

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  // An EXPLICIT Authorization on the request wins (2026-11-02): the Keys
  // well mints a key AS the Chrome alter-ego with that seat's switch token
  // on one request, and the page's own seat must not overwrite it.
  const token = localStorage.getItem('pathos_token')
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
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
