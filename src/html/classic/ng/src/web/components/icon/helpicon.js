/* Greenbone Security Assistant
 *
 * Authors:
 * Björn Ricks <bjoern.ricks@greenbone.net>
 *
 * Copyright:
 * Copyright (C) 2016 - 2017 Greenbone Networks GmbH
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import React from 'react';

import _ from 'gmp/locale.js';
import {is_defined, capitalize_first_letter} from 'gmp/utils.js';

import PropTypes from '../../utils/proptypes.js';

import Icon from './icon.js';

export const HelpIcon = ({page, title, ...other}, {gmp}) => {
  let path = 'help/' + page + '.html';
  let params = {
    token: gmp.token,
  };

  if (!is_defined(title)) {
    title = _('Help: {{pagename}}', {pagename: capitalize_first_letter(page)});
  }

  let url = gmp.buildUrl(path, params);
  return (
    <Icon
      img="help.svg"
      href={url}
      title={title}
      {...other}/>
  );
};

HelpIcon.propTypes = {
  title: PropTypes.string,
  page: PropTypes.string.isRequired,
};

HelpIcon.contextTypes = {
  gmp: PropTypes.gmp.isRequired,
};

export default HelpIcon;

// vim: set ts=2 sw=2 tw=80:

