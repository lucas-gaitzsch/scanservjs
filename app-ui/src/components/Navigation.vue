<template>
  <div>
    <v-app-bar class="elevation-0" :color="appColor" app>
      <v-app-bar-nav-icon v-if="!smAndDown" @click.stop="drawer = !drawer" />
      <v-toolbar-title class="unselectable">{{ $t('global.application-name') }}</v-toolbar-title>
      <v-spacer />
      <v-toolbar-items class="d-none d-md-block">
        <v-btn class="transparent" elevation="0" @click="go('/scan')"><v-icon class="mr-2" :icon="mdiCamera" />{{ $t('navigation.scan') }}</v-btn>
        <v-btn class="transparent" elevation="0" @click="go('/files')"><v-icon class="mr-2" :icon="mdiFileDocumentMultiple" />{{ $t('navigation.files') }}</v-btn>
        <v-btn class="transparent" elevation="0" @click="go('/settings')"><v-icon class="mr-2" :icon="mdiCog" />{{ $t('navigation.settings') }}</v-btn>
        <v-btn class="transparent" elevation="0" @click="go('/about')"><v-icon class="mr-2" :icon="mdiInformation" />{{ $t('navigation.about') }}</v-btn>
      </v-toolbar-items>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" class="elevation-0" app temporary>
      <v-list nav>
        <v-list-item :title="$t('navigation.scan')" @click="go('/scan')">
          <template #prepend>
            <v-icon :icon="mdiCamera" />
          </template>
        </v-list-item>

        <v-list-item :title="$t('navigation.files')" @click="go('/files')">
          <template #prepend>
            <v-icon :icon="mdiFileDocumentMultiple" />
          </template>
        </v-list-item>

        <v-list-item :title="$t('navigation.settings')" @click="go('/settings')">
          <template #prepend>
            <v-icon :icon="mdiCog" />
          </template>
        </v-list-item>

        <v-list-item :title="$t('navigation.about')" @click="go('/about')">
          <template #prepend>
            <v-icon :icon="mdiInformation" />
          </template>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-title class="unselectable">{{ $t('navigation.version') }} {{ version }}</v-list-item-title>
          <template #prepend>
            <v-icon :icon="mdiTools" />
          </template>
        </v-list-item>
      </v-list>

      <template #append>
        <div class="d-flex flex-row pa-4 text-caption">
          <div class="ml-auto">
            &copy; 2016 - {{ new Date().getFullYear() }} Sam Strachan
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <v-bottom-navigation v-if="smAndDown" grow app :color="appColor">
      <v-btn @click="go('/scan')">
        <v-icon :icon="mdiCamera" />
        <span>{{ $t('navigation.scan') }}</span>
      </v-btn>
      <v-btn @click="go('/files')">
        <v-icon :icon="mdiFileDocumentMultiple" />
        <span>{{ $t('navigation.files') }}</span>
      </v-btn>
      <v-btn @click="go('/settings')">
        <v-icon :icon="mdiCog" />
        <span>{{ $t('navigation.settings') }}</span>
      </v-btn>
      <v-btn @click="go('/about')">
        <v-icon :icon="mdiInformation" />
        <span>{{ $t('navigation.about') }}</span>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script>
import Constants from '../classes/constants';
import { mdiCamera, mdiCog, mdiFileDocumentMultiple, mdiInformation, mdiTools } from '@mdi/js';
import { useDisplay } from 'vuetify';
export default {
  name: 'Navigation',

  props: {
    appColor: {
      type: String,
      default: 'accent-4'
    }
  },

  setup() {
    const { smAndDown } = useDisplay();
    return {
      mdiCamera,
      mdiCog,
      mdiFileDocumentMultiple,
      mdiInformation,
      mdiTools,
      smAndDown
    };
  },

  data() {
    return {
      drawer: false,
      version: Constants.Version
    };
  },

  methods: {
    go(location) {
      if (this.$route.path !== location) {
        this.$router.push(location);
      }
    }
  }
};
</script>

<style>
.unselectable {
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
