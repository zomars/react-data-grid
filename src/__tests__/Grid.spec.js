'use strict';
var React         = require('react');
var rewire        = require('rewire');
var Grid          = rewire('../ReactDataGrid');
var TestUtils     = require('react/lib/ReactTestUtils');
var rewireModule  = require("../../test/rewireModule");
var StubComponent = require("../../test/StubComponent");
var helpers       = require('./GridPropHelpers');
var CheckboxEditor       = require('../addons/editors/CheckboxEditor');

describe('ReactDataGridTests', () => {
  var gridInstance;
  var headerScrollLeft
  var HeaderStub = React.createClass({
    setScrollLeft(scroll){
    },
    render(){
      return(<div></div>)
    }
  });
  var ViewportStub = React.createClass({
    setScrollLeft(scroll){
    },
    getScroll(){
      return {scrollLeft : 0}
    },
    render(){
      return(<div></div>)
    }
  });
  var SortableHeaderCellStub = StubComponent('SortableHeaderCell');

  // Configure local variable replacements for the module.
  rewireModule(Grid, {
    Header   : HeaderStub,
    Viewport : ViewportStub,
    SortableHeaderCell : SortableHeaderCellStub
  });

  var testProps = {
    enableCellSelect: true,
    columns: helpers.columns,
    headerRows : [],
    rowsCount : helpers.rowsCount(),
    rowGetter : helpers.rowGetter,
    width:300,
    onRowUpdated : function(update){},
    onCellCopyPaste : function(){},
    onCellsDragged : function(){},
    onGridSort : function(){},
    minHeight : 600,
  }

  beforeEach(() => {
    var rowsCount = 1000;
    gridInstance = TestUtils.renderIntoDocument(<Grid {...testProps}/>);
  });

  it('should create a new instance of Grid', () => {
    expect(gridInstance).toBeDefined();
  });

  it('should render a ViewPort stub', () => {
    var viewport = TestUtils.findRenderedComponentWithType(gridInstance, ViewportStub);
    expect(viewport).toBeDefined();
  });


  it('should render a Toolbar if passed in as props to grid', () => {
    var Toolbar = StubComponent('Toolbar');
    gridInstance = TestUtils.renderIntoDocument(<Grid {...testProps} toolbar={<Toolbar/>} />);
    var toolbarInstance = TestUtils.findRenderedComponentWithType(gridInstance, Toolbar);
    expect(toolbarInstance).toBeDefined();
  });

  it('onToggleFilter trigger of Toolbar should set filter state of grid and render a filterable header row', () => {
    //arrange
    var Toolbar = StubComponent('Toolbar');
    gridInstance = TestUtils.renderIntoDocument(<Grid {...testProps} toolbar={<Toolbar/>} />);
    var toolbarInstance = TestUtils.findRenderedComponentWithType(gridInstance, Toolbar);
    //act
    toolbarInstance.props.onToggleFilter();
    //assert
    var header = TestUtils.findRenderedComponentWithType(gridInstance, HeaderStub);
    expect(gridInstance.state.canFilter).toBe(true);
    expect(header.props.headerRows.length).toEqual(2);
    var filterableHeaderRow = header.props.headerRows[1];
    expect(filterableHeaderRow.ref).toEqual("filterRow");
  });

  it("should be initialized with correct state", () => {
    expect(gridInstance.state).toEqual({
      selectedRows : [],
      selected : {rowIdx : 0,  idx : 0},
      copied : null,
      canFilter : false,
      expandedRows : [],
      columnFilters : {},
      sortDirection : null,
      sortColumn : null,
      dragged : null,
      gridWidth : -2,
      columnInfo : {
        columns : [
        {
          key   : 'id',
          name  : 'ID',
          width : 100,
          left : 0
        },
        {
          key: 'title',
          name: 'Title',
          width : 100,
          left : 100
        },
        {
          key: 'count',
          name: 'Count',
          width : 100,
          left : 200
        }
        ],
        width : 300,
        minColumnWidth : 80,
        totalWidth: -2

      }
    });
  });

  describe("When cell selection disabled", () => {

    it("grid should be initialized with selected state of {rowIdx : -1, idx : -1}", () => {
      gridInstance = TestUtils.renderIntoDocument(<Grid {...testProps} enableCellSelect={false}/>);
        expect(gridInstance.state.selected).toEqual({
          rowIdx : -1,
          idx : -1
        });
      });

  });

  describe("When row selection enabled", () => {

    beforeEach(() => {
      gridInstance = TestUtils.renderIntoDocument(<Grid {...testProps} enableRowSelect={true} />);
    });

    afterEach(() => {
      gridInstance.setState({selectedRows : []});
    });

    it("should render an additional Select Row column", () => {
      var selectRowCol = gridInstance.state.columnInfo.columns[0];
      expect(gridInstance.state.columnInfo.columns.length).toEqual(helpers.columns.length + 1);
      expect(selectRowCol.key).toEqual('select-row');
      expect(TestUtils.isElementOfType(selectRowCol.formatter, CheckboxEditor)).toBe(true);
    });

    it("clicking header checkbox should toggle select all rows", () => {
      //arrange
      var viewport = TestUtils.findRenderedComponentWithType(gridInstance, ViewportStub);
      var selectRowCol = viewport.props.columnInfo.columns[0];
      var headerCheckbox = selectRowCol.headerRenderer;
      var checkbox = document.createElement('input');
      checkbox.type = "checkbox";
      checkbox.value = "value";
      checkbox.checked = true;
      var fakeEvent = {currentTarget : checkbox};
      //act
      headerCheckbox.props.onChange(fakeEvent);
      //assert
      var selectedRows = gridInstance.state.selectedRows;
      expect(selectedRows.length).toEqual(helpers.rowsCount());
      selectedRows.forEach(function(selected){
        expect(selected).toBe(true);
      });
      //trigger unselect
      checkbox.checked = false;
      headerCheckbox.props.onChange(fakeEvent);
      gridInstance.state.selectedRows.forEach(function(selected){
        expect(selected).toBe(false);
      });
    });

    it("should be able to select an individual row when selected = false", () => {
      gridInstance.setState({selectedRows : [false, false, false, false]});
      var viewport = TestUtils.findRenderedComponentWithType(gridInstance, ViewportStub);
      var selectRowCol = viewport.props.columnInfo.columns[0];
      selectRowCol.onRowSelect(3);
      expect(gridInstance.state.selectedRows[3]).toBe(true);
    });

    it("should be able to select an individual row when selected = null", () => {
      gridInstance.setState({selectedRows : [null, null, null, null]});
      var viewport = TestUtils.findRenderedComponentWithType(gridInstance, ViewportStub);
      var selectRowCol = viewport.props.columnInfo.columns[0];
      selectRowCol.onRowSelect(2);
      expect(gridInstance.state.selectedRows[2]).toBe(true);
    });

    it("should be able to unselect an individual row ", () => {
      gridInstance.setState({selectedRows : [null, true, true, true]});
      var viewport = TestUtils.findRenderedComponentWithType(gridInstance, ViewportStub);
      var selectRowCol = viewport.props.columnInfo.columns[0];
      selectRowCol.onRowSelect(3);
      expect(gridInstance.state.selectedRows[3]).toBe(false);
    });
  });


  describe("User Interaction",() => {

    afterEach(() => {
      gridInstance.setState({selected  : {idx : 0, rowIdx : 0}});
    });

    function SimulateGridKeyDown(gridInstance, key, ctrlKey, keyCode){
      var viewportContainerNode = gridInstance.refs.viewPortContainer.getDOMNode();
      TestUtils.Simulate.keyDown(viewportContainerNode, {key: key, keyCode : keyCode || key, ctrlKey : ctrlKey});
    }


    it("hitting TAB should decrement selected cell index by 1", () => {
      SimulateGridKeyDown(gridInstance, 'Tab');
      expect(gridInstance.state.selected).toEqual({
        idx : 1,
        rowIdx : 0
      });
    });

    describe("When selected cell is in top corner of grid", () => {

      beforeEach(() => {
        gridInstance.setState({selected  : {idx : 0, rowIdx : 0}});
      });

      it("on ArrowUp keyboard event should not change selected index", () => {
        SimulateGridKeyDown(gridInstance, 'ArrowUp');
        expect(gridInstance.state.selected).toEqual({
          idx : 0,
          rowIdx : 0
        });
      });

      it("on ArrowLeft keyboard event should not change selected index", () => {
        SimulateGridKeyDown(gridInstance, 'ArrowLeft');
        expect(gridInstance.state.selected).toEqual({
          idx : 0,
          rowIdx : 0
        });
      });

    });

    describe("When selected cell has adjacent cells on all sides", () => {


      beforeEach(() => {
        gridInstance.setState({selected  : {idx : 1, rowIdx : 1}});
      });

      it("on ArrowRight keyboard event should increment selected cell index by 1", () => {
        SimulateGridKeyDown(gridInstance, 'ArrowRight');
        expect(gridInstance.state.selected).toEqual({
          idx : 2,
          rowIdx : 1
        });
      });

      it("on ArrowDown keyboard event should increment selected row index by 1", () => {
        SimulateGridKeyDown(gridInstance, 'ArrowDown');
        expect(gridInstance.state.selected).toEqual({
          idx : 1,
          rowIdx : 2
        });
      });

      it("on ArrowLeft keyboard event should decrement selected row index by 1", () => {
        SimulateGridKeyDown(gridInstance, 'ArrowLeft');
        expect(gridInstance.state.selected).toEqual({
          idx : 0,
          rowIdx : 1
        });
      });

      it("on ArrowUp keyboard event should decrement selected row index by 1", () => {
        SimulateGridKeyDown(gridInstance, 'ArrowUp');
        expect(gridInstance.state.selected).toEqual({
          idx : 1,
          rowIdx : 0
        });
      });
    });

    describe("When column is editable", () => {

      beforeEach(() => {
        testProps.columns[1].editable = true;
        gridInstance = TestUtils.renderIntoDocument(<Grid {...testProps}/>);
      });

      it("double click on grid should activate current selected cell", () => {
        gridInstance.setState({selected : {idx : 1, rowIdx : 1}});
        var viewportContainerNode = gridInstance.refs.viewPortContainer.getDOMNode();
        TestUtils.Simulate.doubleClick(viewportContainerNode);
        expect(gridInstance.state.selected).toEqual({
          idx : 1,
          rowIdx : 1,
          active : true
        })
      });

      it("copy a cell value should store the value in grid state", () => {
        //arrange
        var selectedCellIndex = 1, selectedRowIndex = 1;
        gridInstance.setState({selected  : {idx : selectedCellIndex, rowIdx : selectedRowIndex}});
        var keyCode_c = '99';
        var expectedCellValue = helpers.rowGetter(selectedRowIndex).title;
        //act
        SimulateGridKeyDown(gridInstance, keyCode_c, true);
        //assert
        expect(gridInstance.state.textToCopy).toEqual(expectedCellValue);
        expect(gridInstance.state.copied).toEqual({idx : selectedCellIndex, rowIdx : selectedRowIndex});
      });

      it("paste a cell value should call onCellCopyPaste of gridInstance with correct params", () => {
        //arrange
        spyOn(testProps, 'onCellCopyPaste');
        gridInstance = TestUtils.renderIntoDocument(<Grid {...testProps}/>);
        gridInstance.setState({
          textToCopy : 'banana',
          selected   : {idx : 1, rowIdx : 5},
          copied     : {idx : 1, rowIdx : 1}
        });
        var keyCode_v = '118';
        SimulateGridKeyDown(gridInstance, keyCode_v, true);
        expect(testProps.onCellCopyPaste).toHaveBeenCalled();
        expect(testProps.onCellCopyPaste.mostRecentCall.args[0]).toEqual({cellKey: "title", rowIdx: 5, value: "banana", fromRow: 1, toRow: 5})
      });

      it("cell commit cancel should set grid state inactive", () =>{
        gridInstance.setState({selected : {idx : 1, rowIdx:1, active : true}})
        var viewport = TestUtils.findRenderedComponentWithType(gridInstance, ViewportStub);
        var meta = viewport.props.cellMetaData;
        meta.onCommitCancel();
        expect(gridInstance.state.selected).toEqual({idx : 1, rowIdx : 1, active : false });
      });

      it("pressing escape should set grid state inactive", () =>{
        gridInstance.setState({selected : {idx : 1, rowIdx:1, active : true}})
        SimulateGridKeyDown(gridInstance, 'Escape');
        expect(gridInstance.state.selected).toEqual({idx : 1, rowIdx : 1, active : false });
      });

      it("pressing enter should set grid state active", () =>{
        gridInstance.setState({selected : {idx : 1, rowIdx:1, active : false}})
        SimulateGridKeyDown(gridInstance, 'Enter');
        expect(gridInstance.state.selected).toEqual({idx : 1, rowIdx : 1, active : true, initialKeyCode : 'Enter' });
      });

      it("pressing delete should set grid state active", () =>{
        gridInstance.setState({selected : {idx : 1, rowIdx:1, active : false}})
        SimulateGridKeyDown(gridInstance, 'Delete');
        expect(gridInstance.state.selected).toEqual({idx : 1, rowIdx : 1, active : true, initialKeyCode : 'Delete' });
      });

      it("pressing backspace should set grid state active", () =>{
        gridInstance.setState({selected : {idx : 1, rowIdx:1, active : false}})
        SimulateGridKeyDown(gridInstance, 'Backspace');
        expect(gridInstance.state.selected).toEqual({idx : 1, rowIdx : 1, active : true, initialKeyCode : 'Backspace' });
      });

      it("typing a char should set grid state active and store the typed value", () =>{
        gridInstance.setState({selected : {idx : 1, rowIdx:1, active : false}});
        SimulateGridKeyDown(gridInstance, "Unidentified", null, 66);
        expect(gridInstance.state.selected).toEqual({idx : 1, rowIdx : 1, active : true, initialKeyCode : 66 });
      });

    });

    describe("When column is not editable", () => {
      beforeEach(() => {
        helpers.columns[1].editable = false;
      });

      it("double click on grid should not activate current selected cell", () => {
        gridInstance.setState({selected : {idx : 1, rowIdx : 1}});
        var viewportContainerNode = gridInstance.refs.viewPortContainer.getDOMNode();
        TestUtils.Simulate.doubleClick(viewportContainerNode);
        expect(gridInstance.state.selected).toEqual({
          idx : 1,
          rowIdx : 1
        })
      });
    });

    describe("Drag events", () => {

      it("dragging in grid will store drag rowIdx, idx and value of cell in state", () => {
        gridInstance.setState({selected : {idx : 1, rowIdx : 2}});
        var viewportContainerNode = gridInstance.refs.viewPortContainer.getDOMNode();
        TestUtils.Simulate.dragStart(viewportContainerNode);
        expect(gridInstance.state.dragged).toEqual({
          idx : 1,
          rowIdx : 2,
          value : helpers.rowGetter(2).title
        })
      });

      it("dragging over a row will store the current rowIdx in grid state", () => {
        //arrange
        gridInstance.setState({selected : {idx : 1, rowIdx : 2}, dragged : {idx : 1, rowIdx : 2, value : 'apple', overRowIdx : 6}});
        var viewport = TestUtils.findRenderedComponentWithType(gridInstance, ViewportStub);
        var meta = viewport.props.cellMetaData;
        //act
        meta.handleDragEnterRow(4)
        //assert
        expect(gridInstance.state.dragged).toEqual({
          idx : 1,
          rowIdx : 2,
          value : 'apple',
          overRowIdx : 4
        })
      });

      it("finishing drag will trigger onCellsDragged event and call it with correct params", () => {
        spyOn(testProps, 'onCellsDragged');
        gridInstance = TestUtils.renderIntoDocument(<Grid {...testProps}  />);
        gridInstance.setState({selected : {idx : 1, rowIdx : 2}, dragged : {idx : 1, rowIdx : 2, value : 'apple', overRowIdx : 6}});
        var viewportContainerNode = gridInstance.refs.viewPortContainer.getDOMNode();
        TestUtils.Simulate.dragEnd(viewportContainerNode);
        expect(testProps.onCellsDragged).toHaveBeenCalled();
        expect(testProps.onCellsDragged.argsForCall[0][0]).toEqual({cellKey: "title", fromRow: 2, toRow: 6, value: "apple"});
      });

      it("terminating drag will clear drag state", () => {
        gridInstance = TestUtils.renderIntoDocument(<Grid {...testProps}  />);
        gridInstance.setState({ dragged : {idx : 1, rowIdx : 2, value : 'apple', overRowIdx : 6}});
        var viewport = TestUtils.findRenderedComponentWithType(gridInstance, ViewportStub);
        var meta = viewport.props.cellMetaData;
        meta.handleTerminateDrag()
        expect(gridInstance.state.dragged).toBe(null);
      });

  });

  it("Adding a new row will set the selected cell to be on the last row", () =>{
    var newRow = {id: 1000, title: 'Title 1000', count: 1000};
    helpers.addRow(newRow);
    gridInstance.setProps({rowsCount:helpers.rowsCount()});
    expect(gridInstance.state.selected).toEqual({
      idx : 1,
      rowIdx : 1000
    });
  });

})


});
