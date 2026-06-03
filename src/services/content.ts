import { graphqlClient } from "@/services/graphql";

import type {

  ContentStatus,

  TaxonomyTag,

  TaxonomyScope,

  TaxonomyGroupDeleteStrategy,

  TaxonomyTagNamespace,

  CropGuide,

  CropKind,

  SitePage,

} from "@/types/content";



const GUIDE_FIELDS = `

  id

  cropKind

  slug

  title

  excerpt

  body

  bodySiteMd

  bodySiteMdResolved

  bodyTelegramMd

  cover { id url }

  taxonomyTags { id key namespace label sortOrder parentId cropKind variantAxis status }

  status

  publishedAt

  seoTitle

  seoDescription

  sortOrder

  telegramPublishedAt

  telegramMessageId

  telegramPostUrl

  createdAt

  updatedAt

`;



const SITE_PAGE_FIELDS = `

  id

  key

  title

  sections

  status

  publishedAt

  seoTitle

  seoDescription

  createdAt

  updatedAt

`;



export type CreateCropGuideInput = {

  cropKind: CropKind;

  slug: string;

  title: string;

  excerpt?: string | null;

  bodyJson?: string | null;

  bodySiteMd?: string | null;

  bodyTelegramMd?: string | null;

  coverMediaId?: string | null;

  seoTitle?: string | null;

  seoDescription?: string | null;

  sortOrder?: number | null;

  taxonomyTagIds?: string[] | null;

};



export type UpdateCropGuideInput = {

  cropKind?: CropKind | null;

  slug?: string | null;

  title?: string | null;

  excerpt?: string | null;

  bodyJson?: string | null;

  bodySiteMd?: string | null;

  bodyTelegramMd?: string | null;

  coverMediaId?: string | null;

  status?: ContentStatus | null;

  seoTitle?: string | null;

  seoDescription?: string | null;

  sortOrder?: number | null;

  taxonomyTagIds?: string[] | null;

};

export type CreateTaxonomyScopeInput = {
  key: string;
  label: string;
  description?: string | null;
  sortOrder?: number | null;
};

export type CreateTaxonomyTagInput = {
  scopeKey?: string | null;
  key: string;
  namespace: TaxonomyTagNamespace;
  label: string;
  sortOrder?: number | null;
  parentId?: string | null;
  cropKind?: CropKind | null;
  variantAxis?: string | null;
  status?: import("@/types/content").TaxonomyTagStatus | null;
};

export type UpdateTaxonomyTagInput = {
  key?: string | null;
  namespace?: TaxonomyTagNamespace | null;
  label?: string | null;
  sortOrder?: number | null;
  parentId?: string | null;
  cropKind?: CropKind | null;
  variantAxis?: string | null;
  status?: import("@/types/content").TaxonomyTagStatus | null;
};

const TAXONOMY_TAG_FIELDS = `
  id
  scopeKey
  key
  namespace
  label
  sortOrder
  parentId
  cropKind
  variantAxis
  status
  childIds
  parent { id key label }
`;

const TAXONOMY_TAG_TREE_FIELDS = `
  id
  scopeKey
  key
  namespace
  label
  sortOrder
  parentId
  cropKind
  variantAxis
  status
  childIds
  children {
    id
    scopeKey
    key
    namespace
    label
    sortOrder
    parentId
    status
    childIds
    children {
      id
      key
      label
      sortOrder
      parentId
      status
      childIds
    }
  }
`;



export type UpsertSitePageInput = {

  key: string;

  title: string;

  sectionsJson: string;

  seoTitle?: string | null;

  seoDescription?: string | null;

  status?: ContentStatus | null;

};



type ListGuidesVariables = {

  limit?: number;

  offset?: number;

  cropKind?: CropKind;

  status?: ContentStatus;

  query?: string;

};



class ContentService {

  async listGuides(params: ListGuidesVariables) {

    const data = await graphqlClient.request<

      { cropGuides: { total: number; items: CropGuide[] } },

      ListGuidesVariables

    >({

      query: `

        query CropGuides($limit: Int, $offset: Int, $cropKind: CropKind, $status: ContentStatus, $query: String) {

          cropGuides(limit: $limit, offset: $offset, cropKind: $cropKind, status: $status, query: $query) {

            total

            items { ${GUIDE_FIELDS} }

          }

        }

      `,

      variables: params,

      operationName: "CropGuides",

    });

    return data.cropGuides;

  }



  async getGuide(id: string) {

    const data = await graphqlClient.request<

      { cropGuide: CropGuide | null },

      { id: string }

    >({

      query: `

        query CropGuide($id: ID!) {

          cropGuide(id: $id) { ${GUIDE_FIELDS} }

        }

      `,

      variables: { id },

      operationName: "CropGuide",

    });

    return data.cropGuide;

  }



  async createGuide(input: CreateCropGuideInput) {

    const data = await graphqlClient.request<

      { createCropGuide: CropGuide },

      { input: CreateCropGuideInput }

    >({

      query: `

        mutation CreateCropGuide($input: CreateCropGuideInput!) {

          createCropGuide(input: $input) { ${GUIDE_FIELDS} }

        }

      `,

      variables: { input },

      operationName: "CreateCropGuide",

    });

    return data.createCropGuide;

  }



  async updateGuide(id: string, input: UpdateCropGuideInput) {

    const data = await graphqlClient.request<

      { updateCropGuide: CropGuide },

      { id: string; input: UpdateCropGuideInput }

    >({

      query: `

        mutation UpdateCropGuide($id: ID!, $input: UpdateCropGuideInput!) {

          updateCropGuide(id: $id, input: $input) { ${GUIDE_FIELDS} }

        }

      `,

      variables: { id, input },

      operationName: "UpdateCropGuide",

    });

    return data.updateCropGuide;

  }



  async deleteGuide(id: string) {

    const data = await graphqlClient.request<

      { deleteCropGuide: boolean },

      { id: string }

    >({

      query: `

        mutation DeleteCropGuide($id: ID!) {

          deleteCropGuide(id: $id)

        }

      `,

      variables: { id },

      operationName: "DeleteCropGuide",

    });

    return data.deleteCropGuide;

  }



  async publishGuide(id: string) {

    const data = await graphqlClient.request<

      { publishCropGuide: CropGuide },

      { id: string }

    >({

      query: `

        mutation PublishCropGuide($id: ID!) {

          publishCropGuide(id: $id) { ${GUIDE_FIELDS} }

        }

      `,

      variables: { id },

      operationName: "PublishCropGuide",

    });

    return data.publishCropGuide;

  }



  async publishGuideToTelegram(id: string) {
    const data = await graphqlClient.request<
      {
        publishCropGuideToTelegram: {
          success: boolean;
          message?: string | null;
          telegramMessageId?: string | null;
          telegramPostUrl?: string | null;
          cropGuide: CropGuide;
        };
      },
      { id: string }
    >({
      query: `
        mutation PublishCropGuideToTelegram($id: ID!) {
          publishCropGuideToTelegram(id: $id) {
            success
            message
            telegramMessageId
            telegramPostUrl
            cropGuide { ${GUIDE_FIELDS} }
          }
        }
      `,
      variables: { id },
      operationName: "PublishCropGuideToTelegram",
    });
    return data.publishCropGuideToTelegram;
  }

  async unpublishGuide(id: string) {

    const data = await graphqlClient.request<

      { unpublishCropGuide: CropGuide },

      { id: string }

    >({

      query: `

        mutation UnpublishCropGuide($id: ID!) {

          unpublishCropGuide(id: $id) { ${GUIDE_FIELDS} }

        }

      `,

      variables: { id },

      operationName: "UnpublishCropGuide",

    });

    return data.unpublishCropGuide;

  }



  async getSitePage(key: string) {

    const data = await graphqlClient.request<

      { sitePage: SitePage | null },

      { key: string }

    >({

      query: `

        query SitePage($key: String!) {

          sitePage(key: $key) { ${SITE_PAGE_FIELDS} }

        }

      `,

      variables: { key },

      operationName: "SitePage",

    });

    return data.sitePage;

  }



  async upsertSitePage(input: UpsertSitePageInput) {

    const data = await graphqlClient.request<

      { upsertSitePage: SitePage },

      { input: UpsertSitePageInput }

    >({

      query: `

        mutation UpsertSitePage($input: UpsertSitePageInput!) {

          upsertSitePage(input: $input) { ${SITE_PAGE_FIELDS} }

        }

      `,

      variables: { input },

      operationName: "UpsertSitePage",

    });

    return data.upsertSitePage;

  }



  async publishSitePage(key: string) {

    const data = await graphqlClient.request<

      { publishSitePage: SitePage },

      { key: string }

    >({

      query: `

        mutation PublishSitePage($key: String!) {

          publishSitePage(key: $key) { ${SITE_PAGE_FIELDS} }

        }

      `,

      variables: { key },

      operationName: "PublishSitePage",

    });

    return data.publishSitePage;

  }



  async unpublishSitePage(key: string) {

    const data = await graphqlClient.request<

      { unpublishSitePage: SitePage },

      { key: string }

    >({

      query: `

        mutation UnpublishSitePage($key: String!) {

          unpublishSitePage(key: $key) { ${SITE_PAGE_FIELDS} }

        }

      `,

      variables: { key },

      operationName: "UnpublishSitePage",

    });

    return data.unpublishSitePage;

  }

  async listTaxonomyScopes() {
    const data = await graphqlClient.request<{ taxonomyScopes: TaxonomyScope[] }>({
      query: `
        query TaxonomyScopes {
          taxonomyScopes { key label description sortOrder }
        }
      `,
      operationName: "TaxonomyScopes",
    });
    return data.taxonomyScopes;
  }

  async createTaxonomyScope(input: CreateTaxonomyScopeInput) {
    const data = await graphqlClient.request<
      { createTaxonomyScope: TaxonomyScope },
      { input: CreateTaxonomyScopeInput }
    >({
      query: `
        mutation CreateTaxonomyScope($input: CreateTaxonomyScopeInput!) {
          createTaxonomyScope(input: $input) { key label description sortOrder }
        }
      `,
      variables: { input },
      operationName: "CreateTaxonomyScope",
    });
    return data.createTaxonomyScope;
  }

  async taxonomyForest(scopeKey: string) {
    const data = await graphqlClient.request<
      { taxonomyForest: TaxonomyTag[] },
      { scopeKey: string }
    >({
      query: `
        query TaxonomyForest($scopeKey: String!) {
          taxonomyForest(scopeKey: $scopeKey) { ${TAXONOMY_TAG_TREE_FIELDS} }
        }
      `,
      variables: { scopeKey },
      operationName: "TaxonomyForest",
    });
    return data.taxonomyForest;
  }

  async listTaxonomyTags(params: {
    limit?: number;
    offset?: number;
    query?: string;
    scopeKey?: string | null;
    namespace?: TaxonomyTagNamespace;
    parentId?: string | null;
    cropKind?: CropKind | null;
    status?: import("@/types/content").TaxonomyTagStatus | null;
  }) {
    const data = await graphqlClient.request<
      { taxonomyTags: { total: number; items: TaxonomyTag[] } },
      typeof params
    >({
      query: `
        query TaxonomyTags(
          $limit: Int
          $offset: Int
          $query: String
          $scopeKey: String
          $namespace: TaxonomyTagNamespace
          $parentId: ID
          $cropKind: CropKind
          $status: TaxonomyTagStatus
        ) {
          taxonomyTags(
            limit: $limit
            offset: $offset
            query: $query
            scopeKey: $scopeKey
            namespace: $namespace
            parentId: $parentId
            cropKind: $cropKind
            status: $status
          ) {
            total
            items { ${TAXONOMY_TAG_FIELDS} }
          }
        }
      `,
      variables: params,
      operationName: "TaxonomyTags",
    });
    return data.taxonomyTags;
  }

  async createTaxonomyTag(input: CreateTaxonomyTagInput) {
    const data = await graphqlClient.request<
      { createTaxonomyTag: TaxonomyTag },
      { input: CreateTaxonomyTagInput }
    >({
      query: `
        mutation CreateTaxonomyTag($input: CreateTaxonomyTagInput!) {
          createTaxonomyTag(input: $input) { ${TAXONOMY_TAG_FIELDS} }
        }
      `,
      variables: { input },
      operationName: "CreateTaxonomyTag",
    });
    return data.createTaxonomyTag;
  }

  async updateTaxonomyTag(id: string, input: UpdateTaxonomyTagInput) {
    const data = await graphqlClient.request<
      { updateTaxonomyTag: TaxonomyTag },
      { id: string; input: UpdateTaxonomyTagInput }
    >({
      query: `
        mutation UpdateTaxonomyTag($id: ID!, $input: UpdateTaxonomyTagInput!) {
          updateTaxonomyTag(id: $id, input: $input) { ${TAXONOMY_TAG_FIELDS} }
        }
      `,
      variables: { id, input },
      operationName: "UpdateTaxonomyTag",
    });
    return data.updateTaxonomyTag;
  }

  async deleteTaxonomyTag(id: string) {
    const data = await graphqlClient.request<{ deleteTaxonomyTag: boolean }, { id: string }>({
      query: `
        mutation DeleteTaxonomyTag($id: ID!) {
          deleteTaxonomyTag(id: $id)
        }
      `,
      variables: { id },
      operationName: "DeleteTaxonomyTag",
    });
    return data.deleteTaxonomyTag;
  }

  async deleteTaxonomyGroup(
    id: string,
    strategy: TaxonomyGroupDeleteStrategy,
    newParentId?: string | null,
  ) {
    const data = await graphqlClient.request<
      { deleteTaxonomyGroup: boolean },
      { id: string; strategy: TaxonomyGroupDeleteStrategy; newParentId?: string | null }
    >({
      query: `
        mutation DeleteTaxonomyGroup(
          $id: ID!
          $strategy: TaxonomyGroupDeleteStrategy!
          $newParentId: ID
        ) {
          deleteTaxonomyGroup(id: $id, strategy: $strategy, newParentId: $newParentId)
        }
      `,
      variables: { id, strategy, newParentId },
      operationName: "DeleteTaxonomyGroup",
    });
    return data.deleteTaxonomyGroup;
  }

}



export const contentService = new ContentService();


