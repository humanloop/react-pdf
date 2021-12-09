import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import PageContext from '../PageContext';

import { isPage, isRotate } from '../shared/propTypes';

export class TextLayerItemInternal extends PureComponent {
  state = {
    timer: null,
  }

  componentDidMount() {
    this.alignTextItem();
    this.setState({
      timer: setTimeout(() => {
        this.alignTextItem();
      }, 100),
    });
  }

  componentDidUpdate() {
    this.alignTextItem();
  }

  componentWillUnmount() {
    const { timer } = this.state;
    if (timer) {
      clearTimeout(timer);
    }
  }

  get unrotatedViewport() {
    const { page, scale } = this.props;

    return page.getViewport({ scale });
  }

  /**
   * It might happen that the page is rotated by default. In such cases, we shouldn't rotate
   * text content.
   */
  get rotate() {
    const { page, rotate } = this.props;
    return rotate - page.rotate;
  }

  get sideways() {
    const { rotate } = this;
    return rotate % 180 !== 0;
  }

  get defaultSideways() {
    const { rotation } = this.unrotatedViewport;
    return rotation % 180 !== 0;
  }

  get fontSize() {
    const { transform } = this.props;
    const { defaultSideways } = this;
    const [fontHeightPx, fontWidthPx] = transform;
    return defaultSideways ? fontWidthPx : fontHeightPx;
  }

  get top() {
    const { transform } = this.props;
    const { unrotatedViewport: viewport, defaultSideways } = this;
    const [/* fontHeightPx */, /* fontWidthPx */, offsetX, offsetY, x, y] = transform;
    const [/* xMin */, yMin, /* xMax */, yMax] = viewport.viewBox;
    return defaultSideways ? x + offsetX + yMin : yMax - (y + offsetY);
  }

  get left() {
    const { transform } = this.props;
    const { unrotatedViewport: viewport, defaultSideways } = this;
    const [/* fontHeightPx */, /* fontWidthPx */, /* offsetX */, /* offsetY */, x, y] = transform;
    const [xMin] = viewport.viewBox;
    return defaultSideways ? y - xMin : x - xMin;
  }

  alignTextItem() {
    const element = this.item;

    if (!element) {
      return;
    }

    const {
      fontName, scale, width, styles,
    } = this.props;

    element.style.fontFamily = `${fontName}, "sans-serif"`;

    let tempTransform = '';
    if (width > 0) {
      const targetWidth = width * scale;
      const actualWidth = this.getElementWidth(element);
      tempTransform += ` scaleX(${targetWidth / actualWidth})`;
    }
    const fontStyle = styles[fontName];
    if (fontStyle) {
      tempTransform += ` translateY(${(1 - fontStyle.ascent) * 100}%)`;
    }
    element.style.transform = tempTransform;
    element.style.WebkitTransform = tempTransform;
  }

  getElementWidth = (element) => {
    const { sideways } = this;
    return element.getBoundingClientRect()[sideways ? 'height' : 'width'];
  };

  render() {
    const { fontSize, top, left } = this;
    const {
      customTextRenderer, scale, str: text, dataStart,
    } = this.props;

    return (
      <span
        ref={(ref) => { this.item = ref; }}
        style={{
          height: '1em',
          fontFamily: 'sans-serif',
          fontSize: `${fontSize * scale}px`,
          position: 'absolute',
          top: `${top * scale}px`,
          left: `${left * scale}px`,
          transformOrigin: 'left bottom',
          whiteSpace: 'pre',
          pointerEvents: 'all',
          lineHeight: '1em',
        }}
        data-start={dataStart}
      >
        {
          customTextRenderer
            ? customTextRenderer(this.props)
            : text
        }
      </span>
    );
  }
}

TextLayerItemInternal.propTypes = {
  customTextRenderer: PropTypes.func,
  dataStart: PropTypes.number.isRequired,
  fontName: PropTypes.string.isRequired,
  itemIndex: PropTypes.number.isRequired, // eslint-disable-line react/no-unused-prop-types
  page: isPage.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  pageIndex: PropTypes.number.isRequired,
  rotate: isRotate,
  scale: PropTypes.number,
  str: PropTypes.string.isRequired,
  styles: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  transform: PropTypes.arrayOf(PropTypes.number).isRequired,
  width: PropTypes.number.isRequired,
};

export default function TextLayerItem(props) {
  return (
    <PageContext.Consumer>
      {(context) => <TextLayerItemInternal {...context} {...props} />}
    </PageContext.Consumer>
  );
}
