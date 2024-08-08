<script setup lang="ts">
    import { VRow } from "vuetify/components";
    import { Image } from "../functions/types";
    import { computed } from "vue";

    const props = defineProps<{
        imageToDisplay: Image | null;
    }>();

    const hasImage = computed(() => {
        return props.imageToDisplay != null && props.imageToDisplay.length > 50;
    });
</script>

<template>
    <div>
        <v-row justify="center" v-if="hasImage">
            <v-row class="v-col-12 v-col-xl-4 v-col-lg-6 v-col-md-8 v-col-sm-10 mt-3">
                <img :src="imageToDisplay ?? ''" class="v-col-12" />
            </v-row>
        </v-row>
    </div>
</template>

<style scoped></style>
