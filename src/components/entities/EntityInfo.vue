<template>
  <InfoChip
    kind="entities"
    :id="id"
    :hash-str="hashStr"
    :address="address"
    :primary="primary"
    :secondary="secondary"
    :to="to"
    :dense="dense"
    :pioneer="pioneer"
  />
</template>

<script>
import { defineComponent } from 'vue';
import InfoChip from 'src/components/shared/InfoChip.vue';

export default defineComponent({
  name: 'EntityInfo',
  components: { InfoChip },
  props: {
    id:        { type: [Number, String], default: null },
    hashStr:   { type: String, default: '' },
    address:   { type: String, default: '' },
    primary:   { type: String, default: '' },
    secondary: { type: String, default: '' },
    to:        { type: String, default: null },
    dense:     { type: Boolean, default: false },
    pioneer:   { type: Boolean, default: false }
  }
});
</script>
