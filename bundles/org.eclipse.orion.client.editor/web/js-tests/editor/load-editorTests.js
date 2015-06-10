/*eslint-env browser,amd*/
require({
	baseUrl: "../../",
	paths: {
		text: "requirejs/text",
		i18n: "requirejs/i18n",
	}
});
require(["mocha/sauce"], function(mocha) {
	mocha.setup("bdd");

	// The commented-out test cases below need to be converted to use Mocha.
	require([
		"js-tests/editor/codemirror/codemirrorTests",
		"js-tests/editor/contentAssist/contentAssistFrameworkTests",
		"js-tests/editor/models/annotationModelTests",
		"js-tests/editor/models/projectionModelTests",
		"js-tests/editor/models/textModelTests",
		"js-tests/editor/perf/performanceTests",
		"js-tests/editor/shim/bindShimTests",
		"js-tests/editor/textMateStyler/textMateStylerTests",
		"js-tests/editor/textStyler/textStylerTests"
	], function(){
		mocha.run();
	});
});