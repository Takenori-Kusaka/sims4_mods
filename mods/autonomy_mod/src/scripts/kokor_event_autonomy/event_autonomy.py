"""
Kokor Event Autonomy - Event/Holiday Autonomous Goal Completion

Detects active holidays and events, analyzes their traditions/goals,
and boosts relevant static commodities so sims autonomously complete
event objectives.

Supported events:
- Holidays (Seasons EP): Winterfest, Harvest Fest, Love Day, etc.
- Festivals: Spice Festival, GeekCon, Romance Festival, etc.
- Situation-based events with goals

Architecture:
- Zone injection via Zone.on_loading_screen_animation_finished
- Repeating alarm every 20 sim minutes
- Scans active household sims and boosts event-relevant commodities
- Dynamic tradition/goal detection with keyword-based mapping
"""

import services
import sims4.log
import sims4.resources

logger = sims4.log.Logger('KokorEventAutonomy', default_owner='kokor')

_alarm_handle = None
_recently_boosted = set()


# --- Static Commodity IDs ---
COMMODITY_IDS = {
    'social': 16714,         # staticCommodity_Socialize
    'charisma': 16704,       # staticCommodity_SkillCharisma
    'cook': 105606,          # staticCommodity_SkillCooking
    'gourmet': 115776,       # staticCommodity_SkillGourmetCooking
    'fitness': 16707,        # staticCommodity_SkillFitness
    'mischief': 111720,      # staticCommodity_SkillMischief
    'art': 108831,           # staticCommodity_SkillPainting
    'guitar': 109847,        # staticCommodity_SkillGuitar
    'piano': 115777,         # staticCommodity_SkillPiano
    'violin': 115775,        # staticCommodity_SkillViolin
    'garden': 168145,        # staticCommodity_Gardening_DoGardeningThings
    'write': 109845,         # staticCommodity_SkillWriting
    'read': 24727,           # staticCommodity_ReadBook
    'logic': 25291,          # staticCommodity_SkillLogic
    'program': 115774,       # staticCommodity_SkillProgramming
    'handiness': 109842,     # staticCommodity_SkillHandiness
}

# --- Tradition/Event keyword to commodity mapping ---
# Each keyword pattern maps to a list of (commodity_key, boost_amount) pairs
TRADITION_KEYWORD_MAP = {
    # Cooking traditions
    'cook': [('cook', 200), ('gourmet', 150)],
    'meal': [('cook', 200), ('gourmet', 150)],
    'bake': [('cook', 200)],
    'grill': [('cook', 200)],
    'bbq': [('cook', 200), ('social', 100)],
    'feast': [('cook', 200), ('social', 100)],
    'food': [('cook', 150)],
    'harvest': [('cook', 150), ('garden', 150)],

    # Social traditions
    'gift': [('social', 200), ('charisma', 100)],
    'appreciat': [('social', 200), ('charisma', 100)],
    'kiss': [('social', 200)],
    'romance': [('social', 200)],
    'love': [('social', 200)],
    'flirt': [('social', 200)],
    'friend': [('social', 200), ('charisma', 100)],
    'social': [('social', 200)],
    'talk': [('social', 200), ('charisma', 100)],
    'pirate': [('social', 200), ('mischief', 100)],
    'joke': [('social', 150), ('charisma', 100)],
    'chat': [('social', 150)],
    'toast': [('social', 150)],
    'party': [('social', 150)],

    # Physical traditions
    'strength': [('fitness', 200)],
    'fight': [('fitness', 150), ('mischief', 100)],
    'pillow': [('fitness', 150), ('social', 100)],
    'snow': [('fitness', 150)],
    'swim': [('fitness', 150)],
    'exercise': [('fitness', 200)],
    'sport': [('fitness', 200)],
    'yoga': [('fitness', 200)],
    'run': [('fitness', 150)],
    'dance': [('fitness', 100), ('social', 100)],

    # Creative traditions
    'decorat': [('art', 200)],
    'paint': [('art', 200)],
    'craft': [('art', 150), ('handiness', 100)],
    'sculpt': [('art', 200)],
    'creat': [('art', 150)],
    'draw': [('art', 150)],
    'knit': [('art', 150)],

    # Music traditions
    'carol': [('guitar', 150), ('piano', 100), ('social', 100)],
    'sing': [('guitar', 150), ('social', 100)],
    'music': [('guitar', 150), ('piano', 150), ('violin', 100)],
    'instrument': [('guitar', 150), ('piano', 150)],
    'perform': [('guitar', 100), ('social', 100)],

    # Mischief traditions
    'trick': [('mischief', 200)],
    'prank': [('mischief', 200)],
    'scare': [('mischief', 150)],
    'spook': [('mischief', 150)],

    # Garden traditions
    'garden': [('garden', 200)],
    'plant': [('garden', 200)],
    'flower': [('garden', 150)],
    'egg': [('garden', 100)],  # Easter egg hunt

    # Misc traditions
    'firework': [],  # passive watching, no commodity to boost
    'bonfire': [('social', 100)],
    'camp': [('social', 100), ('fitness', 50)],
    'read': [('read', 150)],
    'write': [('write', 150)],
    'fix': [('handiness', 150)],
    'repair': [('handiness', 150)],
    'build': [('handiness', 150)],
    'geek': [('program', 150), ('logic', 100)],
    'hack': [('program', 200)],
    'game': [('program', 100), ('logic', 100)],
    'spice': [('cook', 200)],
}


def _is_sim_idle(sim):
    """Check if a sim is mostly idle (queue not full)."""
    try:
        if sim is None:
            return False
        queue = sim.queue
        if queue is not None and len(queue) > 2:
            return False
        return True
    except Exception:
        return True


def _boost_commodity(sim_info, commodity_id, amount=100):
    """Boost a static commodity for a sim to nudge autonomy."""
    try:
        stat_manager = services.get_instance_manager(
            sims4.resources.Types.STATISTIC
        )
        if stat_manager is None:
            return False
        commodity = stat_manager.get(commodity_id)
        if commodity is None:
            return False
        tracker = sim_info.statistic_tracker
        if tracker is None:
            return False
        stat = tracker.get_statistic(commodity, add=True)
        if stat is not None:
            current_val = stat.get_value()
            stat.set_value(current_val + amount)
            return True
    except Exception as e:
        logger.warn('Failed to boost commodity {}: {}', commodity_id, e)
    return False


def _match_keywords(text):
    """Match text against tradition keyword map and return commodity boosts."""
    boosts = {}  # commodity_key -> max_amount
    text_lower = text.lower()
    for keyword, commodity_list in TRADITION_KEYWORD_MAP.items():
        if keyword in text_lower:
            for commodity_key, amount in commodity_list:
                if commodity_key not in boosts or boosts[commodity_key] < amount:
                    boosts[commodity_key] = amount
    return boosts


def _get_holiday_tradition_keywords():
    """
    Detect active holiday traditions and return relevant keywords.
    Requires Seasons EP.
    """
    keywords = []
    try:
        holiday_service = services.holiday_service
        if holiday_service is None:
            return keywords

        # Try to get the active holiday ID
        active_holiday_id = None
        try:
            active_holiday_id = holiday_service.get_active_holiday_id()
        except Exception:
            pass

        if active_holiday_id is None:
            return keywords

        # Try to get traditions for the active holiday
        try:
            traditions = holiday_service.get_holiday_traditions(active_holiday_id)
            if traditions:
                for tradition in traditions:
                    try:
                        # Get tradition display name or type name
                        trad_name = ''
                        if hasattr(tradition, '__name__'):
                            trad_name = str(tradition.__name__)
                        elif hasattr(tradition, 'display_name'):
                            trad_name = str(tradition.display_name)
                        if hasattr(tradition, '__class__'):
                            trad_name += ' ' + str(tradition.__class__.__name__)

                        if trad_name:
                            keywords.append(trad_name)
                            logger.info('Active tradition: {}', trad_name)
                    except Exception:
                        continue
        except Exception:
            pass

        # Also try to get the holiday name itself
        try:
            holiday_name = ''
            if hasattr(holiday_service, 'get_holiday_display_name'):
                holiday_name = str(holiday_service.get_holiday_display_name(active_holiday_id))
            elif hasattr(holiday_service, '_holidays'):
                holiday_data = holiday_service._holidays.get(active_holiday_id)
                if holiday_data and hasattr(holiday_data, 'display_name'):
                    holiday_name = str(holiday_data.display_name)
            if holiday_name:
                keywords.append(holiday_name)
                logger.info('Active holiday: {}', holiday_name)
        except Exception:
            pass

    except Exception as e:
        logger.warn('Error detecting holiday traditions: {}', e)

    return keywords


def _get_active_situation_keywords():
    """
    Detect active situations (festivals, events) and extract goal keywords.
    """
    keywords = []
    try:
        situation_manager = services.get_zone_situation_manager()
        if situation_manager is None:
            return keywords

        for situation in situation_manager.running_situations():
            try:
                # Get situation name
                sit_name = ''
                if hasattr(situation, '__class__'):
                    sit_name = str(situation.__class__.__name__)

                # Check for situation goals
                if hasattr(situation, '_goal_tracker') and situation._goal_tracker is not None:
                    goal_tracker = situation._goal_tracker
                    if hasattr(goal_tracker, 'goals'):
                        for goal in goal_tracker.goals:
                            try:
                                goal_name = ''
                                if hasattr(goal, 'display_name'):
                                    goal_name = str(goal.display_name)
                                elif hasattr(goal, '__class__'):
                                    goal_name = str(goal.__class__.__name__)
                                if goal_name:
                                    keywords.append(goal_name)
                            except Exception:
                                continue

                # Also check main_goal
                if hasattr(situation, 'main_goal'):
                    main_goal = situation.main_goal
                    if main_goal is not None:
                        try:
                            goal_name = ''
                            if hasattr(main_goal, 'display_name'):
                                goal_name = str(main_goal.display_name)
                            elif hasattr(main_goal, '__class__'):
                                goal_name = str(main_goal.__class__.__name__)
                            if goal_name:
                                keywords.append(goal_name)
                        except Exception:
                            pass

                if sit_name:
                    keywords.append(sit_name)

            except Exception:
                continue

    except Exception as e:
        logger.warn('Error detecting active situations: {}', e)

    return keywords


def _get_sim_active_event_buffs(sim_info):
    """
    Check if the sim has event-related buffs and extract keywords from them.
    """
    keywords = []
    try:
        buff_component = sim_info.Buffs
        if buff_component is None:
            return keywords

        for buff in buff_component:
            try:
                buff_name = ''
                if hasattr(buff, 'buff_type') and buff.buff_type is not None:
                    if hasattr(buff.buff_type, '__name__'):
                        buff_name = str(buff.buff_type.__name__)

                # Look for event/holiday related buffs
                lower_name = buff_name.lower()
                event_indicators = [
                    'holiday', 'tradition', 'festival', 'event',
                    'pirate', 'winterfest', 'harvestfest', 'loveday',
                    'newyear', 'leisure', 'celebration',
                ]
                for indicator in event_indicators:
                    if indicator in lower_name:
                        keywords.append(buff_name)
                        break
            except Exception:
                continue

    except Exception as e:
        logger.warn('Error checking sim buffs: {}', e)

    return keywords


def _collect_all_event_keywords():
    """Collect event keywords from all available sources."""
    all_keywords = []

    # Source 1: Holiday traditions (Seasons EP)
    holiday_keywords = _get_holiday_tradition_keywords()
    all_keywords.extend(holiday_keywords)

    # Source 2: Active situations (festivals, events)
    situation_keywords = _get_active_situation_keywords()
    all_keywords.extend(situation_keywords)

    return all_keywords


def _compute_boosts_from_keywords(keywords):
    """Convert a list of keywords into commodity boost amounts."""
    combined_boosts = {}  # commodity_key -> max_amount
    for keyword_text in keywords:
        boosts = _match_keywords(keyword_text)
        for commodity_key, amount in boosts.items():
            if commodity_key not in combined_boosts or combined_boosts[commodity_key] < amount:
                combined_boosts[commodity_key] = amount
    return combined_boosts


def _process_sim_for_event(sim_info, global_boosts):
    """Process a single sim: apply event-related commodity boosts."""
    try:
        sim = sim_info.get_sim_instance()
        if sim is None:
            return

        if not _is_sim_idle(sim):
            return

        sim_id = sim_info.sim_id
        if sim_id in _recently_boosted:
            return

        # Merge global boosts with sim-specific buff keywords
        all_boosts = dict(global_boosts)
        sim_keywords = _get_sim_active_event_buffs(sim_info)
        if sim_keywords:
            sim_boosts = _compute_boosts_from_keywords(sim_keywords)
            for key, amount in sim_boosts.items():
                if key not in all_boosts or all_boosts[key] < amount:
                    all_boosts[key] = amount

        if not all_boosts:
            return

        # Apply boosts
        pushed = False
        for commodity_key, amount in all_boosts.items():
            commodity_id = COMMODITY_IDS.get(commodity_key)
            if commodity_id is not None:
                if _boost_commodity(sim_info, commodity_id, amount):
                    pushed = True

        if pushed:
            _recently_boosted.add(sim_id)
            logger.info(
                'Boosted event commodities for sim {} (boosts: {})',
                sim_info, list(all_boosts.keys())
            )

    except Exception as e:
        logger.error('Error processing sim {} for event: {}', sim_info, e)


def _check_event_autonomy(alarm_handle):
    """Periodic callback: detect events and boost autonomy for all household sims."""
    try:
        _recently_boosted.clear()

        household = services.active_household()
        if household is None:
            return

        # Collect event keywords once for all sims
        global_keywords = _collect_all_event_keywords()
        global_boosts = _compute_boosts_from_keywords(global_keywords)

        if global_keywords:
            logger.info(
                'Active event keywords: {} -> commodities: {}',
                global_keywords, list(global_boosts.keys())
            )

        for sim_info in household.sim_info_gen():
            try:
                _process_sim_for_event(sim_info, global_boosts)
            except Exception as e:
                logger.warn('Error checking sim {}: {}', sim_info, e)

    except Exception as e:
        logger.error('Error in event autonomy check: {}', e)


def _setup_alarm():
    """Set up the repeating alarm for event autonomy checks."""
    global _alarm_handle
    try:
        import alarms
        from date_and_time import create_time_span

        if _alarm_handle is not None:
            try:
                alarms.cancel_alarm(_alarm_handle)
            except Exception:
                pass
            _alarm_handle = None

        zone = services.current_zone()
        if zone is None:
            logger.warn('No current zone, cannot set up alarm')
            return

        _alarm_handle = alarms.add_alarm(
            zone,
            create_time_span(minutes=20),
            _check_event_autonomy,
            repeating=True
        )
        logger.info('Event Autonomy alarm registered (20 min interval)')

        # Run an initial check immediately
        _check_event_autonomy(None)

    except Exception as e:
        logger.error('Failed to set up event autonomy alarm: {}', e)


def _teardown_alarm():
    """Cancel the repeating alarm."""
    global _alarm_handle
    if _alarm_handle is not None:
        try:
            import alarms
            alarms.cancel_alarm(_alarm_handle)
        except Exception:
            pass
        _alarm_handle = None


# --- Zone injection for initialization ---
_original_on_loading_screen_finished = None


def _injected_on_loading_screen_finished(self, *args, **kwargs):
    """Injected into Zone.on_loading_screen_animation_finished."""
    result = _original_on_loading_screen_finished(self, *args, **kwargs)
    try:
        _setup_alarm()
    except Exception as e:
        logger.error('Error in zone load hook: {}', e)
    return result


def _inject():
    """Inject our zone load hook into the Zone class."""
    global _original_on_loading_screen_finished
    try:
        import zone
        _original_on_loading_screen_finished = zone.Zone.on_loading_screen_animation_finished
        zone.Zone.on_loading_screen_animation_finished = _injected_on_loading_screen_finished
        logger.info('Kokor Event Autonomy: Zone injection successful')
    except Exception as e:
        logger.error('Failed to inject into Zone: {}', e)


# Module-level initialization
_inject()
logger.info('Kokor Event Autonomy module loaded')
