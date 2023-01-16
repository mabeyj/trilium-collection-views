import { screen } from "@testing-library/dom";
import {
	mockElementBoundingClientRect,
	mockResizeObserver,
} from "jsdom-testing-mocks";
import {
	appendChildren,
	fitToNoteDetailContainer,
	renderError,
	staggeredRender,
} from "collection-views/dom";
import { clearBody, MockApi, MockNoteShort } from "collection-views/test";

describe("appendChildren", () => {
	afterEach(clearBody);

	test("appends elements and text to parent element", () => {
		const $div = document.createElement("div");
		appendChildren(document.body, [$div, document.createTextNode("text")]);
		expect(document.body).toContainElement($div);
		expect(document.body).toHaveTextContent("text");
	});
});

describe("renderError", () => {
	beforeEach(() => {
		new MockApi();
	});

	afterEach(clearBody);

	test("renders error message", () => {
		renderError("<strong>error</strong>");
		const $message = screen.getByText("error");
		expect($message.tagName).toBe("STRONG");
	});
});

describe("fitToNoteDetailContainer", () => {
	const observer = mockResizeObserver();
	let mockApi: MockApi;
	let $element: HTMLElement;

	beforeEach(() => {
		mockApi = new MockApi();
		$element = document.createElement("div");

		jest.spyOn(mockApi.$component, "scrollHeight", "get").mockReturnValue(
			100
		);
		jest.spyOn($element, "scrollHeight", "get").mockReturnValue(80);

		mockElementBoundingClientRect(mockApi.$component, { height: 200 });
	});

	afterEach(clearBody);

	test("resizes element when component is resized", () => {
		api.$container.append($element);
		fitToNoteDetailContainer($element);

		for (let i = 0; i < 2; i++) {
			observer.resize(mockApi.$component);
			expect($element).toHaveStyle({ height: "180px" });
		}
	});

	test("does not resize element if not in the DOM", () => {
		fitToNoteDetailContainer($element);
		observer.resize(mockApi.$component);
		expect($element).toHaveStyle({ height: "" });
	});
});

describe("staggeredRender", () => {
	afterEach(clearBody);

	function getByTextRange(start: number, end: number): void {
		for (let i = start; i <= end; i++) {
			screen.getByText(`${i}`);
		}
	}

	test("appends elements to parent element", async () => {
		const notes: NoteShort[] = [];
		for (let i = 1; i <= 30; i++) {
			notes.push(new MockNoteShort({ title: `${i}` }));
		}

		await staggeredRender(document.body, 2, notes, async (note) => {
			const $p = document.createElement("p");
			$p.textContent = note.title;
			return $p;
		});

		getByTextRange(1, 2);
		await screen.findByText("3");
		getByTextRange(4, 27);
		await screen.findByText("28");
		getByTextRange(29, 30);
	});
});
