export interface OpenApiTagMeta {
  group: string;
  description?: string;
}

const tagMetaRegistry = new Map<string, OpenApiTagMeta>();
const nestJsAutoControllerTags = new Set<string>();

export function registerOpenApiTagMeta(tag: string, meta: OpenApiTagMeta) {
  const existing = tagMetaRegistry.get(tag);

  tagMetaRegistry.set(tag, {
    group: meta.group,
    description: meta.description ?? existing?.description,
  });
}

/** NestJS Swagger가 컨트롤러 클래스명에서 자동 생성하는 태그 (예: AdminFilesController → AdminFiles) */
export function registerNestJsAutoControllerTag(tag: string) {
  nestJsAutoControllerTags.add(tag);
}

export function getNestJsAutoControllerTags() {
  return nestJsAutoControllerTags;
}

export function getOpenApiTagMeta(tag: string) {
  return tagMetaRegistry.get(tag);
}

export function buildOpenApiTagGroups(usedTags: Set<string>) {
  const groupsMap = new Map<string, string[]>();

  for (const tag of usedTags) {
    const meta = tagMetaRegistry.get(tag);

    if (!meta) {
      continue;
    }

    const tags = groupsMap.get(meta.group) ?? [];
    tags.push(tag);
    groupsMap.set(meta.group, tags);
  }

  return [...groupsMap.entries()]
    .sort(([leftName], [rightName]) => leftName.localeCompare(rightName))
    .map(([name, tags]) => ({
      name,
      tags: tags.sort(),
    }));
}
