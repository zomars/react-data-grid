/* TODO@flow mixins */

var ColumnMetrics        = require('./ColumnMetrics');
var DOMMetrics           = require('./DOMMetrics');
Object.assign            = require('object-assign');
var React                = require('react');
var PropTypes            = React.PropTypes;
var CheckboxEditor       = require('./addons/editors/CheckboxEditor');

type ColumnMetricsType = {
    columns: Array<Column>;
    totalWidth: number;
    minColumnWidth: number;
};

class Column {
  key: string;
  left: number;
  width: number;
};

module.exports = {
  mixins: [DOMMetrics.MetricsMixin],

  propTypes: {
    columns: PropTypes.arrayOf(Column),
    minColumnWidth: PropTypes.number,
    columnEquality: PropTypes.func
  },

  DOMMetrics: {
    gridWidth(): number {
      return this.getDOMNode().offsetWidth - 2;
    }
  },

  getDefaultProps(): {minColumnWidth: number; columnEquality: (a: Column, b: Column) => boolean}  {
    return {
      minColumnWidth: 80,
      columnEquality: ColumnMetrics.sameColumn
    };
  },

  getInitialState(): ColumnMetricsType {
    return this.getColumnMetricsType(this.props, true);
  },

  componentWillReceiveProps(nextProps: ColumnMetricsType) {
    if (nextProps.columns) {
      if (!ColumnMetrics.sameColumns(this.props.columns, nextProps.columns, this.props.columnEquality)) {
        this.setState(this.getColumnMetricsType(nextProps));
      } else {
        var index = {};
        this.state.columnInfo.columns.forEach((c) => {
          index[c.key] = {width: c.width, left: c.left};
        });
        var nextColumns = Object.assign(this.state.columnInfo, {
          columns: nextProps.columns.map((c) => Object.assign(c, index[c.key]))
        });
        this.setState({columnInfo: nextColumns});
      }
    }
  },

  getColumnMetricsType(props: ColumnMetricsType, initial: ?number): { columns: ColumnMetricsType; gridWidth: number } {
    var totalWidth = initial ? initial : this.DOMMetrics.gridWidth();
    var cols = this.getDecoratedColumns(props.columns);
    return {
      columnInfo: ColumnMetrics.calculate({
        columns: cols,
        totalWidth: totalWidth,
        minColumnWidth: props.minColumnWidth
      }),
      gridWidth: totalWidth
    };
  },

  getDecoratedColumns: function(columns: Array<ExcelColumn>): Array<ExcelColumn> {
    var cols = columns.map(function(column) {
                column = Object.assign({}, column);
                if (column.sortable) {
                  var sortDirection = this.state.sortColumn === column.key ?  this.state.sortDirection : DEFINE_SORT.NONE;
                  column.headerRenderer = <SortableHeaderCell columnKey={column.key} onSort={this.handleSort} sortDirection={sortDirection}/>;
                }
                return column;
              }, this);
    if(this.props.enableRowSelect){
      cols.unshift({
        key: 'select-row',
        name: '',
        formatter : <CheckboxEditor/>,
        onRowSelect :this.handleRowSelect,
        filterable : false,
        headerRenderer : <input type="checkbox" onChange={this.handleCheckboxChange} />,
        width : 60
      });
    }
  return cols;
  },

  metricsUpdated() {
    this.setState(this.getColumnMetricsType(this.props));
  },

  onColumnResize(index: number, width: number) {
    var columnInfo = ColumnMetrics.resizeColumn(this.state.columnInfo, index, width);
    this.setState({columnInfo});
  }
};
