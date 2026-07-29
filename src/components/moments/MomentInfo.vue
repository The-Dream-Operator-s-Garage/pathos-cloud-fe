<template>
  <InfoChip
    kind="moments"
    :id="resolvedId"
    :hash-str="hashStr"
    :address="address"
    :primary="resolvedPrimary"
    :secondary="resolvedSecondary"
    :dense="dense"
  />
</template>

<script>
import { defineComponent, computed } from 'vue';
import { date } from 'quasar';
import InfoChip from 'src/components/shared/InfoChip.vue';

// The moment flavor of the Info tier. Two input shapes:
//   1. :moment="{...}" (+ optional :human="{datetime, place}") — API rows
//   2. :moment-id / :hash-str / :address — self-resolving via /refs/summary
export default defineComponent({
  name: 'MomentInfo',
  components: { InfoChip },
  props: {
    moment:   { type: Object, default: null },
    human:    { type: Object, default: null },
    momentId: { type: [Number, String], default: null },
    hashStr:  { type: String, default: '' },
    address:  { type: String, default: '' },
    dense:    { type: Boolean, default: false }
  },
  setup (props) {
    const momentDate = computed(() => {
      const raw = props.moment?.time_utc;
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    });

    // Format in UTC — pathchain's canonical time. quasar's formatDate is
    // local-only, so shift by the tz offset first (same trick MomentMini
    // uses); this keeps the chip identical to server-resolved summaries.
    const fmtUtc = (d) =>
      date.formatDate(new Date(d.getTime() + d.getTimezoneOffset() * 60000), 'ddd, D MMM YYYY · h:mm A');

    const resolvedPrimary = computed(() => {
      if (props.human?.datetime) return props.human.datetime;
      return momentDate.value ? fmtUtc(momentDate.value) : '';
    });

    const resolvedSecondary = computed(() => props.human?.place || '');

    const resolvedId = computed(() =>
      props.momentId ?? props.moment?.id ?? null);

    return { resolvedPrimary, resolvedSecondary, resolvedId };
  }
});
</script>
