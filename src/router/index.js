import { route } from 'quasar/wrappers';
import { createRouter, createWebHashHistory } from 'vue-router';
import routes from './routes';
import { useNavStore } from 'src/stores/navigation';

export default route(function () {
  const router = createRouter({
    history: createWebHashHistory(),
    routes
  });

  router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('pathos_token');
    if (to.meta.requiresAuth && !isAuthenticated) {
      next('/auth');
    } else if (to.path === '/auth' && isAuthenticated) {
      next('/feed');
    } else {
      next();
    }
  });

  // Sync push into nav store on every authenticated navigation.
  // Must run synchronously so isNavigating guard works correctly when
  // the bar itself drove the navigation (Back/Forward/Checkpoint*).
  router.afterEach((to) => {
    if (to.path === '/auth') return;
    if (!localStorage.getItem('pathos_token')) return;

    try {
      const navStore = useNavStore();
      navStore.push(to);
    } catch (e) {
      // Pinia may not be active during the very first navigation; ignore.
    }
  });

  return router;
});
