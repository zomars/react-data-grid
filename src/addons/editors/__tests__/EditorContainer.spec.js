
const React            = require('react');
const rewire           = require('rewire');
const EditorContainer  = rewire('../EditorContainer.js');
const TestUtils        = require('react/lib/ReactTestUtils');
const SimpleTextEditor = require('../SimpleTextEditor');

describe('Editor Container Tests', () => {
  let cellMetaData = {
    selected: {
      idx: 0,
      rowIdx: 0
    },
    onCommit: function() {}
  };

  let component;
  let container;

  let fakeColumn = {
    name: 'col1',
    key: 'col1',
    width: 100
  };

  let rowData = {
    col1: 'I',
    col2: 'love',
    col3: 'Testing'
  };

  describe('Basic render tests', () => {
    beforeEach(() => {
      component = TestUtils.renderIntoDocument(<EditorContainer
        rowData={rowData}
        value={'Adwolf'}
        cellMetaData={cellMetaData}
        column={fakeColumn}
        height={50}/>);
    });
    it('should create a new EditorContainer instance', () => {
      expect(component).toBeDefined();
    });

    it('should render a simpleTextEditor if no column.editor property', () => {
      let editor = TestUtils.findRenderedComponentWithType(component, SimpleTextEditor);
      expect(editor).toBeDefined();
    });

    it('should select the text of the default input when the editor is rendered', () => {
      function isTextSelected(input) {
        if (typeof input.selectionStart === 'number') {
          return input.selectionStart === 0 && input.selectionEnd === input.value.length;
        } else if (typeof document.selection !== 'undefined') {
          input.focus();
          return document.selection.createRange().text === input.value;
        }
      }

      let editor = TestUtils.findRenderedComponentWithType(component, SimpleTextEditor);
      expect(isTextSelected(editor.getInputNode())).toBeDefined();
    });

    it('should render the editor with the correct properties', () => {
      let editor = TestUtils.findRenderedComponentWithType(component, SimpleTextEditor);
      expect(editor.props.value).toEqual('Adwolf');
      expect(editor.props.column).toEqual(fakeColumn);
    });
  });
  
  describe('Select / drop down lists', () => {
    
  });
  
  describe('Caret position tests', () => {
    //NOTE: these tests dont add huge value
    // but, till we have x-browser tests, its the best we can do
    // with x-briowser tests, we shoudl be checking the actual functionality (so render a text box and click right 3x)
    let fakeInput;
    let fakeTextRange;
    beforeEach(() => {
      component = TestUtils.renderIntoDocument(<EditorContainer
        rowData={rowData}
        value={'Adwolf'}
        cellMetaData={cellMetaData}
        column={fakeColumn}
        height={50}/>);
        
      fakeTextRange = {
        moveStart: () => {},
        collapse: () => {},
        select: () => {}
      };  
      fakeInput = {
        value: 'test',
        setSelectionRange: () => { },
        createTextRange: () => { return fakeTextRange; },
      };
    });

   
    
    it('should use setSelectionRange', () => {
      let editor = TestUtils.findRenderedComponentWithType(component, SimpleTextEditor);
      component.getInputNode = () => { 
        return fakeInput;
       };
      spyOn(fakeInput, 'setSelectionRange');
      
      component.setCaretAtEndOfInput();
      expect(fakeInput.setSelectionRange).toHaveBeenCalled();
    });
    
    
    it('should use createTextRange if setSelectionRange is null', () => {
      let editor = TestUtils.findRenderedComponentWithType(component, SimpleTextEditor);
      fakeInput.setSelectionRange = null;
      component.getInputNode = () => { 
        return fakeInput;
       };
      spyOn(fakeInput, 'createTextRange');
      
      component.setCaretAtEndOfInput();
      expect(fakeInput.createTextRange).toHaveBeenCalled();
    });
    
    it('should call move / collapse / select if using createTextRange', () => {
      let editor = TestUtils.findRenderedComponentWithType(component, SimpleTextEditor);
      fakeInput.setSelectionRange = null;
      component.getInputNode = () => { 
        return fakeInput;
       };
      spyOn(fakeInput, 'createTextRange');      
      spyOn(fakeTextRange, 'moveStart');
      spyOn(fakeTextRange, 'collapse');
      spyOn(fakeTextRange, 'select');
      
      component.setCaretAtEndOfInput();
      expect(fakeInput.createTextRange).toHaveBeenCalled();
      //TODO we shoudl really verify the order of these, as it is important\
      expect(fakeTextRange.moveStart).toHaveBeenCalled();
      expect(fakeTextRange.collapse).toHaveBeenCalled();
      expect(fakeTextRange.select).toHaveBeenCalled();
    });
    
    
  });
  
  describe('Events', () => {
    beforeEach(() => {
      cellMetaData.onCommit = function() {};
      spyOn(cellMetaData, 'onCommit');

      // render into an actual div, not a detached one
      // otherwise IE (11) gives an error when we try and setCaretAtEndOfInput
      container = document.createElement('div');
      document.body.appendChild(container);
      component = React.render(<EditorContainer
        rowData={rowData}
        value={'Adwolf'}
        cellMetaData={cellMetaData}
        column={fakeColumn}
        height={50}/>, container);
    });

    afterEach(() => {
      // remove our container
      document.body.removeChild(container);
    });

    it('hitting enter should call commit of cellMetaData only once', () => {
      let editor = TestUtils.findRenderedComponentWithType(component, SimpleTextEditor);
      TestUtils.Simulate.keyDown(editor.getInputNode(), {key: 'Enter'});
      expect(cellMetaData.onCommit).toHaveBeenCalled();
      expect(cellMetaData.onCommit.callCount).toEqual(1);
    });
  });
});
