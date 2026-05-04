<template>
  <div class="settings-item d-flex flex-column flex-md-row mt-4">
    <div class="settings-item-description pt-2"><slot name="description" /></div>
    <div class="settings-item-action d-flex ml-md-auto mt-2 mt-md-0"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.settings-item-description {
  flex: 1 1 auto;
}

.settings-item-action {
  flex: 0 0 auto;
}

@media (max-width: 959px) {
  .settings-item-action,
  .settings-item-action :deep(.v-input),
  .settings-item-action :deep(.v-btn) {
    width: 100%;
  }
}
</style>
