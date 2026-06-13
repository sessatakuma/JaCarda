interface GuideBox {
    xEnd: number;
    xStart: number;
    yEnd: number;
    yStart: number;
}

export const card = {
    height: 1350,
    width: 1080,
} as const;

export const grid = {
    columnGutter: 24,
    columns: 12,
    marginBottom: 36,
    marginLeft: 56,
    marginRight: 56,
    marginTop: 36,
    rowGutter: 24,
    rows: 16,
} as const;

export const layout = {
    copyright: {
        xEnd: 11.5,
        xStart: 8.5,
        yEnd: 15.5,
        yStart: 15.25,
    },
    exampleTitle: {
        xEnd: 11.5,
        xStart: 0,
        yEnd: 12,
        yStart: 10.5,
    },
    meaningBox: {
        xEnd: 11,
        xStart: 0.5,
        yEnd: 10,
        yStart: 7,
    },
    phrase: {
        xEnd: 11.5,
        xStart: 0,
        yEnd: 5.5,
        yStart: 3,
    },
    phraseRule: {
        xEnd: 10.5,
        xStart: 1,
        yEnd: 6,
        yStart: 5,
    },
    sentenceBox: {
        xEnd: 11,
        xStart: 0.5,
        yEnd: 14.5,
        yStart: 12.5,
    },
    type: {
        xEnd: 11.5,
        xStart: 0,
        yEnd: 2,
        yStart: 1,
    },
} satisfies Record<string, GuideBox>;

export const style = {
    accent: '#6da58e',
    accentSoft: '#dceee8',
    background: '#fbfbfb',
    displayTypeface:
        '"Tsunagi Gothic", "TsunagiGothic", "A-OTF Shin Go Pr6N", "Hiragino Sans", "Yu Gothic", sans-serif',
    ink: '#242b36',
    logo: 'Sessatakuma',
    logoTypeface: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
    mutedInk: '#596579',
    typeface: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
} as const;

export const typeScales = [
    { body: 48, display: 200, heading: 96, logo: 24, name: 'default' },
    { body: 29.33, display: 117.33, heading: 58.67, logo: 16, name: 'compact' },
    { body: 26.67, display: 106.67, heading: 53.33, logo: 16, name: 'dense' },
] as const;

export const phraseFitFontSizes = [
    180, 160, 144, 128, 112, 96, 80, 64, 56, 48, 40,
] as const;

const gridWidth = card.width - grid.marginLeft - grid.marginRight;
const gridHeight = card.height - grid.marginTop - grid.marginBottom;
const columnWidth =
    (gridWidth - (grid.columns - 1) * grid.columnGutter) / grid.columns;
const rowHeight = (gridHeight - (grid.rows - 1) * grid.rowGutter) / grid.rows;

export function guideBox(box: GuideBox): {
    centerX: number;
    centerY: number;
    height: number;
    width: number;
    x: number;
    y: number;
} {
    const x = guideX(box.xStart);
    const y = guideY(box.yStart);
    const endX = guideX(box.xEnd);
    const endY = guideY(box.yEnd);

    return {
        centerX: x + (endX - x) / 2,
        centerY: y + (endY - y) / 2,
        height: endY - y,
        width: endX - x,
        x,
        y,
    };
}

function guideX(position: number): number {
    const track = Math.trunc(position);
    const fraction = position - track;

    return (
        grid.marginLeft +
        track * (columnWidth + grid.columnGutter) +
        fraction * columnWidth
    );
}

function guideY(position: number): number {
    const track = Math.trunc(position);
    const fraction = position - track;

    return (
        grid.marginTop +
        track * (rowHeight + grid.rowGutter) +
        fraction * rowHeight
    );
}
