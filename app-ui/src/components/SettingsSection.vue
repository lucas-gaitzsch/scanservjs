<template>
  <v-card elevation="2" class="settings-section mb-4" rounded="lg">
    <v-card-title><slot name="title" /></v-card-title>
    <v-card-text>
      <slot name="items" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
@media (max-width: 959px) {
  .settings-section :deep(.v-card-text) {
    padding-top: 8px;
  }
}
</style>
