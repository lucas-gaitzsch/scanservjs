<template>
  <v-dialog v-model="show" aria-role="dialog" max-width="760" :fullscreen="smAndDown" persistent aria-modal @keydown.stop="_onKeys">
    <v-card class="batch-dialog-card">
      <v-card-title class="batch-dialog-title">
        {{ message }}
      </v-card-title>
      <v-card-text class="batch-dialog-content">
        <v-img v-if="image" class="batch-dialog-preview" :src="'data:image/jpeg;base64,' + image" contain />
        <div v-if="!image" class="text-body-1 text-medium-emphasis">
          {{ $t('scan.message:turn-documents') }}
        </div>
      </v-card-text>
      <v-card-actions class="batch-dialog-actions">
        <v-btn v-if="onRescan" class="batch-dialog-rescan" variant="tonal" @click.prevent="rescan">{{ $t('batch-dialog.btn-rescan') }}</v-btn>
        <v-btn class="batch-dialog-next" color="primary" size="large" @click.prevent="next">{{ $t('batch-dialog.btn-next') }}</v-btn>
        <v-btn v-if="onFinish" class="batch-dialog-finish" color="green" variant="tonal" @click.prevent="finish">{{ $t('batch-dialog.btn-finish') }}</v-btn>
        <v-btn class="batch-dialog-cancel" color="warning" variant="tonal" @click.prevent="cancel">{{ $t('batch-dialog.btn-cancel') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Constants from '../classes/constants';
import { useDisplay } from 'vuetify';

export default {
  name: 'BatchDialog',
  setup() {
    const { smAndDown } = useDisplay();
    return {
      smAndDown
    };
  },

  data() {
    return {
      message: null,
      image: null,
      show: false,
      onFinish: null,
      onNext: null,
      onRescan: null,
      onCancel: null,
    };
  },

  methods: {
    _onKeys(event) {
      if (event.keyCode === Constants.Keys.enter) {
        this.ok();
      }
    },

    finish() {
      this.show = false;
      if (this.onFinish) {
        this.onFinish();
      }
    },

    rescan() {
      this.show = false;
      if (this.onRescan) {
        this.onRescan();
      }
    },

    next() {
      this.show = false;
      if (this.onNext) {
        this.onNext();
      }
    },

    cancel() {
      this.show = false;
      if (this.onCancel) {
        this.onCancel();
      }
    },

    open(options) {
      this.message = options.message;
      this.image = options.image;
      this.onFinish = options.onFinish;
      this.onRescan = options.onRescan;
      this.onNext = options.onNext;
      this.onCancel = options.onCancel;
      this.show = true;
    }
  }
};
</script>

<style scoped>
.batch-dialog-card {
  display: flex;
  flex-direction: column;
  max-height: 100%;
}

.batch-dialog-title {
  white-space: normal;
}

.batch-dialog-content {
  flex: 1 1 auto;
  overflow: auto;
}

.batch-dialog-preview {
  max-height: 58vh;
}

.batch-dialog-actions {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 959px) {
  .batch-dialog-preview {
    max-height: calc(100vh - 240px);
  }

  .batch-dialog-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  }

  .batch-dialog-actions .v-btn {
    min-width: 0;
  }

  .batch-dialog-rescan {
    order: 1;
  }

  .batch-dialog-next {
    order: 2;
  }

  .batch-dialog-finish {
    order: 3;
  }

  .batch-dialog-cancel {
    order: 4;
  }
}
</style>
