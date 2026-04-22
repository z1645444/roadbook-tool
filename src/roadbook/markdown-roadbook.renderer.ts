import type {
  RoadbookRenderDay,
  RoadbookRenderDayLodging,
  RoadbookRenderInput,
  RoadbookRenderLodgingEntry
} from './roadbook-render.types';

const DEFAULT_TITLE = '骑行路书';

const roundToOneDecimal = (value: number): string => (Math.round(value * 10) / 10).toFixed(1);

const formatDistance = (meters: number): string => `${roundToOneDecimal(meters / 1000)} km`;

const formatDuration = (seconds: number): string => `${roundToOneDecimal(seconds / 3600)} h`;

const escapeMarkdown = (text: string): string =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/([*_`[\]{}()#+\-.!|>])/g, '\\$1');

const formatOptionalNumber = (value: number | null, suffix = ''): string => {
  if (value === null || !Number.isFinite(value)) {
    return 'N/A';
  }
  return `${value}${suffix}`;
};

const buildWaypointSequence = (day: RoadbookRenderDay): string => {
  if (day.startPoint === null) {
    return 'N/A';
  }

  const sequence: string[] = [day.startPoint.name];
  for (const segment of day.segments) {
    sequence.push(segment.to.name);
  }

  return sequence
    .filter((name, index) => index === 0 || name !== sequence[index - 1])
    .map(escapeMarkdown)
    .join(' → ');
};

const formatLodgingEntry = (entry: RoadbookRenderLodgingEntry): string => {
  const escapedName = escapeMarkdown(entry.name);
  const rating = formatOptionalNumber(entry.rating);
  const price = formatOptionalNumber(entry.priceCny, ' CNY');
  const distance = formatDistance(entry.distanceMeters);
  return `- ${escapedName} | rating: ${rating} | price: ${price} | distance: ${distance}`;
};

const renderLodgingCategory = (
  label: string,
  entries: RoadbookRenderLodgingEntry[],
  lines: string[]
): void => {
  lines.push(`### ${label}`);
  if (entries.length === 0) {
    lines.push('- 无匹配住宿');
    return;
  }

  for (const entry of entries) {
    lines.push(formatLodgingEntry(entry));
  }
};

const renderLodgingSection = (lodging: RoadbookRenderDayLodging): string[] => {
  const lines: string[] = ['### 住宿建议'];

  if (lodging.policyStatus === 'no_match') {
    lines.push('当前日未找到满足筛选条件的住宿候选。');
  }

  if (lodging.fallbackTrace.length > 0) {
    lines.push(`Fallback Trace: ${lodging.fallbackTrace.map(escapeMarkdown).join(' -> ')}`);
  }

  renderLodgingCategory('Hostel', lodging.categories.hostel, lines);
  renderLodgingCategory('Guesthouse', lodging.categories.guesthouse, lines);
  renderLodgingCategory('Hotel', lodging.categories.hotel, lines);
  return lines;
};

const renderDaySection = (day: RoadbookRenderDay): string[] => {
  const start = day.startPoint ? escapeMarkdown(day.startPoint.name) : 'N/A';
  const end = day.endPoint ? escapeMarkdown(day.endPoint.name) : 'N/A';

  const lines: string[] = [
    `## Day ${day.dayIndex}`,
    `Route: ${start} -> ${end}`,
    `Distance: ${formatDistance(day.totalDistanceMeters)}`,
    `Estimated Ride Time: ${formatDuration(day.totalDurationSeconds)}`,
    `Waypoints: ${buildWaypointSequence(day)}`
  ];

  if (day.segments.length > 0) {
    lines.push('### Segments');
    for (const segment of day.segments) {
      lines.push(
        `- ${escapeMarkdown(segment.from.name)} -> ${escapeMarkdown(segment.to.name)} (${formatDistance(
          segment.distanceMeters
        )}, ${formatDuration(segment.durationSeconds)})`
      );
    }
  }

  if (day.lodging !== null && day.overnightStopPoint !== null) {
    lines.push(...renderLodgingSection(day.lodging));
  }

  return lines;
};

const renderConstraintSummary = (input: RoadbookRenderInput): string[] => {
  const lines: string[] = ['## 约束摘要', input.recap?.summary ? escapeMarkdown(input.recap.summary) : '无'];
  return lines;
};

const renderAssumptions = (input: RoadbookRenderInput): string[] => {
  const assumptions = input.recap?.assumptions ?? [];
  const lines: string[] = ['## 假设与修正'];
  if (assumptions.length === 0) {
    lines.push('- 无假设项');
  } else {
    for (const item of assumptions) {
      lines.push(`- ${escapeMarkdown(item)}`);
    }
  }
  lines.push('- 修正路径：回复 `revise <field>: <value>` 可覆盖当前假设。');
  return lines;
};

const renderValidationContext = (input: RoadbookRenderInput): string[] => {
  if (!input.options?.includeValidationContext || input.routeMetadata === null) {
    return [];
  }

  const metadata = input.routeMetadata;
  return [
    '## 校验上下文',
    `- generatedAtIso: ${escapeMarkdown(metadata.generatedAtIso)}`,
    `- provider: ${escapeMarkdown(metadata.provider)}`,
    `- endpoint: ${escapeMarkdown(metadata.endpoint)}`,
    `- requestFingerprint: ${escapeMarkdown(metadata.requestFingerprint)}`,
    `- responseHash: ${escapeMarkdown(metadata.responseHash)}`,
    `- infocode: ${escapeMarkdown(metadata.infocode ?? 'N/A')}`
  ];
};

export const renderMarkdownRoadbook = (input: RoadbookRenderInput): string => {
  const title = input.options?.title?.trim() || DEFAULT_TITLE;
  const lines: string[] = [`# ${escapeMarkdown(title)}`];

  lines.push(...renderConstraintSummary(input));
  lines.push(...renderAssumptions(input));

  if (input.routePlan.length === 0) {
    lines.push('## Day 1');
    lines.push('Route: N/A -> N/A');
    lines.push('Distance: 0.0 km');
    lines.push('Estimated Ride Time: 0.0 h');
    lines.push('Waypoints: N/A');
  } else {
    const sortedDays = [...input.routePlan].sort((left, right) => left.dayIndex - right.dayIndex);
    for (const day of sortedDays) {
      lines.push(...renderDaySection(day));
    }
  }

  lines.push(...renderValidationContext(input));
  return `${lines.join('\n')}\n`;
};
