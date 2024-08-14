<script setup lang="ts">
    import { VRow } from "vuetify/components";
    import { Image } from "../functions/image";
    import { computed, ref } from "vue";
    import { watch } from "vue";

    const props = withDefaults(
        defineProps<{
            imageToDisplay: Image | null;
            displayData?: boolean;
        }>(),
        {
            displayData: false,
        }
    );

    const imageURL = ref("");
    const metaInfo = ref("");

    watch(props, async () => {
        if (props.imageToDisplay) {
            const url = props.imageToDisplay.generateDataURL();
            imageURL.value = url;
            metaInfo.value = props.imageToDisplay.getImageMetaText();
        }
    });

    const hasImage = computed(() => {
        return props.imageToDisplay != null && imageURL.value.length > 50;
    });
</script>

<template>
    <div>
        <v-row justify="center" v-if="hasImage">
            <v-row class="v-col-12 v-col-xl-4 v-col-lg-6 v-col-md-8 v-col-sm-10">
                <img :src="imageURL ?? ''" class="v-col-12" />
            </v-row>
            <v-row v-if="displayData" class="v-col-12 ma-0 pa-0" justify="center" no-gutters>{{ metaInfo }}</v-row>
        </v-row>
    </div>
</template>

<style scoped></style>
