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
            scalePower?: number;
            sliderPrecisionPower?: number;
        }>(),
        {
            onlyEnd: false,
            scalePower: 0,
            sliderPrecisionPower: 0,
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
            emitResult(localValue.value);
        }
    });

    function emitResult(val: number) {
        emit("update:modelValue", val);
    }
</script>

<template>
    <div class="input-grp">
        <div class="text-caption">{{ label }}</div>
        <v-slider
            v-model="localValue"
            :min="props.min * Math.pow(10, props.scalePower)"
            :max="props.max * Math.pow(10, props.scalePower)"
            :hide-details="true"
            thumb-label
            :step="1 * Math.pow(10, props.scalePower) * Math.pow(10, props.sliderPrecisionPower)"
            @end="
                (newVal) => {
                    if (onlyEnd) {
                        emitResult(newVal);
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
