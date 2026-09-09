(function () {
  "use strict";
  const legacy = window.PromptDeckDocumentDesignContract;
  const resolver = window.PromptDeckDocumentResolver;
  if (!legacy || !resolver) return;
  const schema = "promptdeck-document-design/3.0";
  const labels = {
    colorPresence: { low: "색을 절제하고 작은 강조점에 집중", balanced: "색과 여백을 균형 있게 배치", high: "주색과 강조색의 존재감을 풍부하게 표현" },
    breathing: { compact: "밀도 있게 정리하되 읽기 편한 행간 유지", balanced: "안정적인 여백과 문단 호흡", airy: "넉넉한 여백과 여유로운 문단 호흡" },
    imagePresence: { text: "텍스트를 중심으로 이미지를 작게 보조", balanced: "본문과 이미지의 비중을 균형 있게", image: "이미지를 주도적으로 배치하고 본문과 연결" },
    titlePresence: { quiet: "제목을 절제된 크기와 무게로", clear: "제목 위계를 명확하게", strong: "제목의 크기와 무게를 대담하게" },
    decorationPresence: { minimal: "장식을 최소화하고 읽기에 집중", balanced: "장식과 정보의 균형 유지", rich: "문서의 분위기를 살리는 장식을 풍부하게" },
  };
  const componentLabels = {
    tableStyle: { rules: "얇은 가로선 중심", striped: "교차 행 음영", plain: "선과 음영을 최소화" },
    chartType: { bar: "비교에 적합한 막대형", line: "연속 변화에 적합한 선형", donut: "구성비에 적합한 도넛형" },
    iconStyle: { line: "일관된 선형 아이콘·픽토그램", solid: "일관된 면형 아이콘·픽토그램", square: "각진 사각 배지 안에 정리한 안내 아이콘·픽토그램" },
    backgroundStyle: { wash: "절제된 단색 면으로 배경 구성", band: "가장자리의 색 띠로 구획을 연결", frame: "가는 테두리로 지면을 차분하게 감싸기", grid: "옅은 격자 패턴으로 정돈된 배경 구성" },
    backgroundScope: { cover: "표지에 테마 배경 적용", chapter: "표지와 장 도입에 테마 배경 적용", all: "전체 지면에 테마 배경 적용", none: "배경 장식 없이 바탕색만 유지" },
    imageStyle: { original: "이미지 본래 색감 유지", muted: "이미지 색감을 차분하게 통일" },
    diagramStyle: { flow: "순서와 흐름을 연결하는 도식", hierarchy: "단계와 포함 관계를 드러내는 도식" },
  };
  const formatRules = { PDF: "지정 판형을 유지하고 글꼴 포함·페이지 경계·인쇄 결과를 검수한다.", DOCX: "편집 가능한 스타일·표·머리말·꼬리말을 사용하고 페이지 나눔을 검수한다.", HWPX: "문단·글자 스타일과 표를 편집 가능하게 구성하고 지정 판형으로 렌더링을 검수한다.", PPTX: "문서의 지정 크기를 슬라이드 크기에 적용하고 텍스트·표·도형을 편집 가능하게 구성한다.", HTML: "화면에서는 반응형으로 읽을 수 있게 구성하고 인쇄 스타일은 지정한 판형·방향을 정확하게 유지한다." };
  function isV3(input) { return !!(input?.bundleId || input?.stateVersion === 3); }
  const interpretationRules = {
    faithful: "견본에 가깝게: 선택한 배치·정렬·위계·장식의 관계를 충실히 따르고, 원문의 분량을 수용하는 데 필요한 줄바꿈과 페이지 나눔만 유연하게 조정한다.",
    balanced: "분위기를 유지하며 조정: 견본의 색상 역할·서체·배치 의도를 유지하며, 문서 분량과 읽는 흐름에 맞춰 비율·여백·장식 위치를 자연스럽게 조정한다.",
    creative: "폭넓게 재해석: 선택한 배치의 핵심 관계와 읽는 순서를 출발점으로 삼아 비율·여백·장식·시각적 리듬을 창의적으로 변주한다. 변주는 문서 전체에서 일관되게 적용한다.",
  };
  function buildSpec(input) {
    const { state, design } = resolver.resolve(input);
    const { image, ...semantic } = design; // Local demonstration artwork is never production content.
    return { schema, ...semantic, formats: state.formats, creativeDirection: Object.fromEntries(Object.entries(state.feel).map(([key, value]) => [key, labels[key][value]])), referenceOnly: true, preserveSource: true };
  }
  function renderDesignPrompt(spec) {
    const p = spec.physicalSpec;
    const bindings = { none: "제본 없음", left: "좌철", top: "상철", saddle: "중철", perfect: "무선제본", hardcover: "양장", spiral: "스프링제본" };
    const duplex = { single: "단면", duplex: "양면", "duplex-long": "양면·긴쪽 넘김", "duplex-short": "양면·짧은쪽 넘김" };
    const scopeNames = { heading: "제목·장 제목", body: "본문", numeral: "수치·차트·쪽번호", table: "표", caption: "캡션·주석", quote: "인용문" };
    return [
      "## 문서 비주얼 편집 지침 (PromptDeck DocumentDesignSpec 3.0)",
      "이 지침은 별도로 제공한 원문의 시각 편집에만 적용한다. 내용·문장·사실·수치·고유명사·목차·순서를 임의로 수정·요약·추가하지 않는다.",
      `완성 규격: ${p.sizeId} ${p.orientation === "landscape" ? "가로형" : "세로형"}, ${p.widthMm}×${p.heightMm}mm. ${bindings[p.bindingId]}, ${duplex[p.duplex]}, ${p.spreadMode === "single-pages" ? "낱쪽" : "맞쪽 펼침"}, 사방 도련 ${p.bleedMm}mm. 완성 크기와 도련을 구분하고 이 물리 규격을 정확하게 유지한다.`,
      `통합 견본: ${spec.label}. 표지부터 본문·특수 지면까지 같은 색상 역할·서체·정렬 원칙을 유지한다.`,
      `AI 해석 범위: ${interpretationRules[spec.interpretation] || interpretationRules.balanced}`,
      "어떤 해석 범위에서도 원문·사실·수치·순서, 지정 용지 크기·방향·도련, 최종 색상값과 서체 적용 범위는 지킨다. 시각적 변주를 위해 내용이나 문서 규격을 바꾸지 않는다.",
      ...spec.rules.map((r) => `디자인 방향: ${r}`),
      `느낌: ${Object.values(spec.creativeDirection).join("; ")}. 이는 시각적 의도이며, 글자 크기·행간·여백 수치를 고정하는 명령이 아니다. 원문의 길이와 지정 판형에 맞춰 창의적으로 해석한다.`,
      `색상: 주색 ${spec.palette.primary}, 보조색 ${spec.palette.secondary}, 강조색 ${spec.palette.accent}, 바탕 ${spec.palette.background}, 본문 ${spec.palette.text}, 보조 글자 ${spec.palette.muted}, 면 ${spec.palette.surface}, 선 ${spec.palette.border}. 주색은 제목·구획, 강조색은 핵심 포인트, 보조색은 연결 정보에 일관되게 배치한다.`,
      ...(spec.colorScheme ? [`색상 조합: ${spec.colorScheme.label}${spec.colorScheme.customizedRoles.length ? " (일부 색상 직접 조정)" : ""}. ${spec.colorScheme.direction}. 이 느낌은 색상 배치와 사용 면적에 창의적으로 반영하되 위에 지정한 최종 색상값을 기준으로 한다.`, "표지·본문·표·차트·도식에서 같은 색상 역할을 유지한다. 색면 위의 글자는 읽기 쉬운 밝거나 어두운 색을 선택하고, 차트의 구분은 색과 직접 표기·선 모양을 함께 사용한다. 원본 사진이나 삽화는 팔레트 변경만을 이유로 다시 채색하지 않는다."] : []),
      `서체 범위: ${Object.entries(spec.typographyScope).map(([k, v]) => `${scopeNames[k]}=${v}`).join("; ")}. 한글 글리프와 사용 권한을 확인하고 동일 서체를 포함할 수 없으면 유사한 서체로 대체한 사실을 알린다.`,
      ...(window.PromptDeckDocumentHierarchy?.prompt(spec.hierarchy) || []),
      `요소 표현: ${Object.entries(spec.componentStyles).map(([key, value]) => componentLabels[key]?.[value]).filter(Boolean).join("; ")}.`,
      "표는 머리행·단위·수치 정렬을 명확히 하고 다음 면에 이어질 때 머리행을 반복한다. 차트는 원본 데이터의 의미를 우선하며, 선택 형식이 부적합하면 왜곡 없이 적합한 형식으로 조정한다. 단위·기준일·출처는 제공된 경우만 표시한다.",
      "이미지는 제공된 이미지나 권리가 확인된 자료만 활용한다. 그림의 중요 부분을 임의로 자르지 않고 캡션·출처를 인접 배치한다. 배경·아이콘·픽토그램·도식은 내용의 이해를 돕는 위치에 배치하고 스타일을 통일한다.",
      "아래 지면 규칙은 해당 내용이 원문에 있을 때의 편집 방식이다. 지면 종류를 채우기 위해 내용을 새로 만들지 않는다.",
      ...spec.pages.map((page) => `- ${page.label}: ${page.rule}${page.layout ? ` 배치 선택: ${page.layout.label}. ${page.layout.rule}` : ""}`),
      "선택한 배치의 핵심 관계와 읽는 순서를 유지한다. 본문 분량이 늘면 같은 편집 원칙으로 다음 면에 이어 배치하며, 지면에 맞추기 위해 내용을 생략하거나 글자를 과도하게 줄이지 않는다. 배치를 바꿔도 색상 역할·서체 범위·용지 규격은 유지한다.",
      "장문은 동일한 제목·번호·쪽번호·캡션 체계를 반복하고, 표·문제·정답·인용은 관련 정보가 분리되지 않도록 나눈다. 제본 안쪽 여유와 홀짝 페이지, 펼침 중앙의 정보 손실을 확인한다.",
      ...spec.formats.map((format) => `${format} 규칙: ${formatRules[format]}`),
      "참고 이미지는 디자인 방향을 보여주는 견본이다. 예시 문장·수치·인물·사진·삽화를 실제 문서에 전재하지 않는다. 참고 이미지와 실제 결과가 픽셀 단위로 같아야 한다는 의미는 아니다.",
      "검수: 원문 보존, 정확한 판형·방향, 글자 대비, 넘침·잘림, 표 행 분리, 한글 서체, 전체 페이지 일관성을 확인한다. 이 지침의 제목·항목명·제작 메타데이터를 문서 본문에 출력하지 않는다.",
    ].join("\n");
  }
  function build(input) {
    if (!isV3(input)) return legacy.build(input);
    const { state, issues } = resolver.resolve(input);
    const spec = buildSpec(state);
    const designPrompt = renderDesignPrompt(spec);
    return { state, spec, designPrompt, fullPrompt: legacy.composeFullPrompt(state.sourcePrompt, designPrompt), issues };
  }
  window.PromptDeckDocumentDesignContract = Object.freeze({ ...legacy, schema,
    normalize: (input) => isV3(input) ? resolver.normalize(input) : legacy.normalize(input),
    validate: (input) => isV3(input) ? resolver.resolve(input).issues : legacy.validate(input),
    buildSpec: (input) => isV3(input) ? buildSpec(input) : legacy.buildSpec(input),
    renderDesignPrompt: (spec) => spec.schema === schema ? renderDesignPrompt(spec) : legacy.renderDesignPrompt(spec), build,
  });
})();
