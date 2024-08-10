<script setup lang="ts">
    import { VSlider } from "vuetify/components";
    import { computed, ref, watch } from "vue";

    const props = withDefaults(
        defineProps<{
            modelValue: number;
            min: number;
            max: number;
            onlyEnd?: boolean;
            label: string;
        }>(),
        {
            onlyEnd: false,
        }
    );
    const emit = defineEmits<{
        "update:modelValue": [number];
    }>();

    const parentValue = computed(() => {
        return props.modelValue;
    });

    const localValue = ref(parentValue.value);

    watch(parentValue, () => {
        localValue.value = parentValue.value;
    });

    watch(localValue, () => {
        if (!props.onlyEnd) {
            emit("update:modelValue", localValue.value);
        }
    });
</script>

<template>
    <div class="input-grp">
        <div class="text-caption">{{ label }}</div>
        <v-slider
            v-model="localValue"
            :min="props.min"
            :max="props.max"
            :hide-details="true"
            thumb-label
            step="1"
            @end="
                (newVal) => {
                    if (onlyEnd) {
                        emit('update:modelValue', newVal);
                    }
                }
            "
        ></v-slider>
    </div>
</template>

<style scoped>
    .input-grp {
        width: 100%;
        padding-left: 15%;
        padding-right: 15%;
    }
</style>
